var _ = require('lodash')
	, util = require('util')
	, EventEmitter = require('events').EventEmitter
	, Context = require('./executionContext')


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
	start: function () {
		for (var i in this.script.functions) {
			this.execute([ { pos: [Number(i)], stack: {} } ], true);
		}
	},
	stop: function () {
		this._global.emit('stop');
	},
	assembleContext: function (exStack) {
		return new Context(this, exStack);
	},
	handleReturn: function (exStack, args) {
		var cpStack
			, top
			, fc

		//Copy the stack, as it will be modified and need to be intact for parallel executions
		cpStack = _.cloneDeep(exStack);

		while (cpStack) {
			top = cpStack[cpStack.length - 1];
			fc = this.script.traverse(top.pos);
			if (!fc)
				return;
			if (fc.callbacks.length || cpStack.length <= 1) {
				break;
			}
			cpStack.pop();
			if (!cpStack.length)
				return;
		}

		if (fc.callbacks.length) {
			for (var i in fc.callbacks) {
				var newStack = resolveStack(fc, args, cpStack, this.constants);
				newStack[newStack.length - 1].pos.push(Number(i));
				this.execute(newStack);
			}
		}
		
	},
	execute: function (exStack, locally) {
		var top
			, fc;
		if (!exStack.length) return;
		top = exStack[exStack.length - 1];
		fc = this.script.traverse(top.pos);
		if (!fc) {
			this.engine._err('Failure in traversing path: ' + util.inspect(top.pos));
			return;
		}
		if (!fc.selector) {
			//Is a continuation
			var cont = this.script.continuations[fc.name];
			if (!cont) {
				this.engine._err('Could not find continuation: ' + fc.name);
				return;
			}
			var id = this.script.getContId(fc.name);
			if (!id) {
				this.engine._err('Error in finding a correlating id for the continuation: ' + fc.name);
				return;
			}
			var newstack = buildStack(fc, cont, top.stack, this.script.constants);
			if (!fc.callbacks) {
				//If function call lacks any callbacks, the current chain is complete and we can 
				//remove the topmost item in execution stack
				//also known as tail call optimization
				exStack.pop(); 
			}
			for (var cid in cont.callbacks) {
				this.execute(exStack.concat({ pos: [ id, Number(cid) ], stack: newstack }));
			}
		}
		else {
			var nodes = this.engine.resolve(fc.selector, locally);
			for (var i in nodes) {
				var node = nodes[i];
				if (node.executable) {
					var self = this;
					_.defer(function () {
						var args = buildArgs(fc, top.stack, self.script.constants);
						node.execute(fc.name, self, exStack, args);
					});
				}
				else {
					node.send(this.script.signature, exStack);
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
