var _ = require('lodash')
	, util = require('util')
	, EventEmitter = require('events').EventEmitter;

exports.create = function () {
	return new Dir();
};

var Dir = function () {
	EventEmitter.call(this);
	this.items = {};
};
util.inherits(Dir, EventEmitter);

Dir.prototype.add = function (key, item) {
	if (this.items[key])
		throw new Error('That directory key is already in use');
	this.items[key] = item;
	this.emit('added', key, item);
};
Dir.prototype.remove = function (key) {
	if (this.items[key]) {
		this.items[key] = undefined;
		this.emit('removed', key);
	}
}
Dir.prototype.filter = function (iterator, context) {
	var results = []
		, self = this;
	if (self.items == null) return results;
	_.each(_.keys(self.items), function (key) {
		var value = self.items[key];
		if (iterator.call(context, key, value)) results[results.length] = value;
	});
	return results;
}
Dir.prototype.get = function (key) {
	return this.items[key];
}

