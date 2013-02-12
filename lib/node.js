var directory = require('./directory')

var Node = module.exports = function (name, classes, engine) {
	this.name = name;
	this.classes = classes;
	this.executable = true;
	this.functions = directory.create();
};

Node.prototype = {
	match: function (selector) {
		return selector === this.name;
	},
	execute: function (fname, context, args) {
		var f = this.functions.get(fname);
		if (!f) {
			engine._err('Function ' + fname + ' was not found in node ' + this.name);
			return;
		}
		f.apply(context, args);
	}
};
