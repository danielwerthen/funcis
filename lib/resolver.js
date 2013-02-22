var _ = require('lodash');

exports.args = function (func, stack, constants) {
	return _.map(func.input, function (ip) {
		return resolveParam(ip, stack, constants);
	});
};

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
