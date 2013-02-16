var directory = require('./directory')
	, u2 = require('./utilities')
	, _ = require('underscore')

var Node = module.exports = function (name, classes, engine) {
	this.name = name;
	this.classes = classes;
	this.executable = true;
	this.functions = directory.create();
};

Node.prototype = {
	match: function (selector) {
		return u2.matcher.node(this.name, this.classes, selector);
	},
	execute: function (fname, runner, stack, args, done) {
		var f = this.functions.get(fname);
		if (!f) {
			engine._err('Function ' + fname + ' was not found in node ' + this.name);
			done();
			return;
		}
		f.apply(runner._global, args.concat(function () {
			var args = Array.prototype.slice.call(arguments);
			runner.handleReturn(stack, args, function () {
			});
		}));
		done();
	}
};
