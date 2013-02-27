var directory = require('./directory')
	, u2 = require('./utilities')
	, _ = require('lodash')

var Node = module.exports = function (name, classes, engine) {
	this.name = name;
	this.classes = classes;
	this.executable = true;
	this.functions = directory.create();
	this.engine = engine;
	this.context;
};

Node.prototype = {
	match: function (selector) {
		return u2.matcher.node(this.name, this.classes, selector);
	},
	execute: function (name, args, state, done) {
		var f = this.functions.get(name)
			, self = this;
		if (!f) {
			done('Function not found');
			return;
		}
		f.apply(this.engine.context(state), args.concat(function () {
			var args = Array.prototype.slice.call(arguments);
			self.engine.handleExit(state, args);
		}));
		done();
	}
};
