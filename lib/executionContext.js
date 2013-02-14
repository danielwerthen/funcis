var Store = require('./localStore')
	, _ = require('underscore');

var Context = module.exports = function (runner, stack) {
	this.runner = runner;
	this._locals = runner._locals;
	this.global = runner._global;
	this.stack = stack;
	var key = stack[stack.length - 1].pos.join(',');
	this.local = new Store(this, key);
	this.next = _.bind(function () {
		var args = Array.prototype.slice.call(arguments);
		this.runner.handleReturn(this.stack, args);
	}, this);
};
