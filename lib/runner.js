var _ = require('underscore')
	, util = require('util')
	, EventEmitter = require('events').EventEmitter


var Runner = module.exports = function (name, script, engine) {
	this.name = name;
	this.script = script;
	this.engine = engine;
};

Runner.prototype = {
	start: function () {
		for (var i in this.script.functions) {
			this.execute([ { pos: [i], stack: {} } ], true);
		}
	},
	stop: function () {
	},
	execute: function (exStack, locally) {
		var top
			, fc;
		if (!exStack.length) return;
		top = _.last(exStack);
		fc = this.script.traverse(top.pos);
		if (!fc) return;
		if (!fc.selector) {
			//Is a continuation
			var cont = this.script.continuations[fc.name];
			if (!cont) {
				this.engine._err('Could not find continuation: ' + fc.name);
				return;
			}
			var id = this.script.getContId(fc.name);
			if (!_.isNumber(id)) {
				this.engine._err('Error in finding a correlating id for the continuation: ' + fc.name);
				return;
			}
			var newstack = buildContStack(fc, cont, top.stack);
			for (var cid in cont.callbacks) {
				this.execute(exStack.concat({ pos: [ id, cid ], stack: newstack }));
			}
		}
		else {

		}
	}
};

function buildStack(fin, fout, stack) {
	var in = []
		, out = {};
	if (!stack) {
		stack = fout;
		fout = fin;
	}
	for (var i in fin.input) {
		in[in.length] = resolveParam(fin.input[p], stack);
	}
	for (var i in fout.output) {
		out[fout.output[i].val] = in[i];
	}
	for (var i in fout.passalongs) {
		var key = fout.passalongs[i];
		if (!out[key])
			out[key] = stack[key];
	}
	return out;
}

function resolveParam(p, stack) {
	if (p.type === 'arg') {
		return evalArg(param.val, stack);
	}
	else if (p.type === 'json' || p.type === 'array') {
		return resolveJSON(p.val, stack);
	}
	else if (p.type === 'num') {
		return Number(p.val);
	}
	else {
		return p.val;
	}
}

function evalArg(str, stack) {
	var re = /\.?([^\.\[\]]+)(\[([^\.\[\]]+)\])?\.?/g
		, cap
		, val;
	while (cap = re.exec(str)) {
		if (!val) {
			val = stack[cap[1]];
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

function resolveJSON(str, stack) {
	var re = /:\s*([A-Za-z]\w*)(.[^,\s\}]*)?\s*/
		, cap;
	while (cap = re.exec(str)) {
		if (!stack[cap[1]]) {
			throw new Error('Unresolved function input parameter "' + cap[1] + '"');
		}
		str = str.replace(re, ': ' + evalArg(cap[1] + cap[2], stack));
	}
	return JSON.parse(str);
}

//util.inherits(Runner, EventEmitter);

