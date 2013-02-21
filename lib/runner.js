var _ = require('lodash')
	, util = require('util')
	, EventEmitter = require('events').EventEmitter
	, Context = require('./executionContext')
	, contDefs = require('./continuations')


var Runner = module.exports = function (name, script, engine) {
	var self = this;
	self.name = name;
	self.script = script;
	self.engine = engine;
	self._globalState = {};
	self._global = _.extend({ 
		get: function (key) { return self._globalState[key]; }
		, set: function (key, val) { self._globalState[key] = val; }
	}, new EventEmitter);
	self._locals = {};
};

Runner.prototype = {
	start: function (done) {
		var fin = _.after(this.script.functions.length, done);
		for (var i in this.script.functions) {
			this.execute([ { pos: [Number(i)], stack: {} } ], true, fin);
		}
	},
	stop: function () {
		this._global.emit('stop');
	},
	assembleContext: function (exStack) {
		return new Context(this, exStack);
	},
	handleReturn: function (exStack, args, done) {
		var cpStack
			, top
			, fc

		//Copy the stack, as it will be modified and need to be intact for parallel executions
		cpStack = _.cloneDeep(exStack);

		while (cpStack) {
			top = cpStack[cpStack.length - 1];
			fc = this.script.traverse(top.pos);
			if (!fc)
				return done('No function call found');
			if (fc.callbacks.length || cpStack.length <= 1) {
				break;
			}
			cpStack.pop();
			if (!cpStack.length) {
				return done('Bad stack format');
			}
		}

		if (fc.callbacks.length) {
			var fin = _.after(fc.callbacks.length, done);
			for (var i in fc.callbacks) {
				var cp = _.cloneDeep(cpStack);
				var newStack = resolveStack(fc, args, cp, this.constants);
				newStack[newStack.length - 1].pos.push(Number(i));
				this.execute(newStack, false, fin);
			}
		}
		else return done();
		
	},
	execute: function (exStack, locally, done) {
		var top
			, fc
			, self = this;
		if (!exStack.length) return;
		top = exStack[exStack.length - 1];
		fc = this.script.traverse(top.pos);
		if (!fc) {
			this.engine._log(1, 'Failure in traversing path: ' + util.inspect(top.pos));
			done();
			return;
		}
		if (!fc.selector) {
			//Is a continuation
			var cont = this.script.continuations[fc.name];
			if (!cont) {
				if (_.isFunction(contDefs[fc.name])) {
					//Is a predefined continuation
					var args = buildArgs(fc, top.stack, self.script.constants);
					if (contDefs[fc.name].apply(null, args)) {
						if (!fc.callbacks.length) {
							return done();
						}

						var fin = _.after(fc.callbacks.length, done);
						for (var cid in fc.callbacks) {
							var cpStack = _.cloneDeep(exStack);
							var newStack = resolveStack(fc, args, cpStack, this.constants);
							newStack[newStack.length - 1].pos.push(Number(cid));
							this.execute(newStack, false, fin);
						}
						return;
					} else {
						done();
						return;
					}
				}
				else {
					this.engine._log(1, 'Could not find continuation: ' + fc.name);
					done();
					return;
				}
			}
			var id = this.script.getContId(fc.name);
			if (!id) {
				this.engine._log(1, 'Error in finding a correlating id for the continuation: ' + fc.name);
				done();
				return;
			}
			var newstack = buildStack(fc, cont, top.stack, this.script.constants);
			if (!fc.callbacks) {
				//If function call lacks any callbacks, the current chain is complete and we can 
				//remove the topmost item in execution stack
				//also known as tail call optimization
				exStack.pop(); 
			}
			if (!cont.callbacks.length) return done();
			var fin = _.after(cont.callbacks.length, done);
			for (var cid in cont.callbacks) {
				this.execute(exStack.concat({ pos: [ id, Number(cid) ], stack: newstack }), locally, fin);
			}
		}
		else {
			var nodes = this.engine.resolve(fc.selector, locally);
			if (!nodes.length) return done();
			var fin = _.after(nodes.length, done);
			for (var i in nodes) {
				var node = nodes[i];
				if (node.executable) {
					_.defer(function () {
						var args = buildArgs(fc, top.stack, self.script.constants);
						node.execute(fc.name, self, exStack, args, fin);
					});
				}
				else {
					node.send(this.script.signature, exStack, fin);
				}
			}
		}
	}
};

function resolveStack(fc, args, stack) {
	var top = stack[stack.length - 1];
	for (var i in fc.output) {
		var p = fc.output[i];
		top.stack[p.val] = args[i];
	}
	return stack;
}

function buildArgs(fc, stack, constants) {
	var args = [];
	for (var i in fc.input) {
		args[i] = resolveParam(fc.input[i], stack, constants);
	}
	return args;
}

function buildStack(fin, fout, stack, constants) {
	var ain = []
		, out = {};
	if (!stack) {
		stack = fout;
		fout = fin;
	}
	for (var i in fin.input) {
		ain[ain.length] = resolveParam(fin.input[i], stack, constants);
	}
	for (var i in fout.output) {
		out[fout.output[i].val] = ain[i];
	}
	for (var i in fout.passalongs) {
		var key = fout.passalongs[i];
		if (!out[key])
			out[key] = stack[key];
	}
	return out;
}

function resolveParam(p, stack, constants) {
	if (p.type === 'arg') {
		return evalArg(p.val, stack, constants);
	}
	else if (p.type === 'json' || p.type === 'array') {
		return resolveJSON(p.val, stack, constants);
	}
	else if (p.type === 'num') {
		return Number(p.val);
	}
	else {
		return p.val;
	}
}

function getConstantVal(str, constants) {
	var c = constants[str];
	if (c) {
		if (c.type === 'num')
			return Number(c.val);
		return c.val;
	}
	if (c === null)
		return null;
	return undefined;
}

function evalArg(str, stack, constants) {
	var re = /\.?([^\.\[\]]+)(\[([^\.\[\]]+)\])?\.?/g
		, cap
		, val;
	while (cap = re.exec(str)) {
		if (!val) {
			val = stack[cap[1]] || getConstantVal(cap[1], constants);
		}
		else {
			val = val[cap[1]];
		}
		if (cap[3]) {
			val = val[cap[3]];
		}
	}
	return val;
}

function resolveJSON(str, stack, constants) {
	var re = /:\s*([A-Za-z]\w*)(.[^,\s\}]*)?\s*/
		, cap;
	while (cap = re.exec(str)) {
		if (!stack[cap[1]]) {
			throw new Error('Unresolved function input parameter "' + cap[1] + '"');
		}
		str = str.replace(re, ': ' + evalArg(cap[1] + cap[2], stack, constants));
	}
	return JSON.parse(str);
}
