var _ = require('lodash')
	, util = require('util')
	, async = require('async')
	, EventEmitter = require('events').EventEmitter

var Context = module.exports = function () {
	this._store = {};
	this._onStop = [];
};

Context.prototype.get = function (key) {
	if (this._store[key])
		return this._store[key];
};

Context.prototype.set = function (key, val) {
	this._store[key] = val;
};

Context.prototype.onstop = function (fn) {
	this._onStop.push(fn);
};

Context.prototype.stop = function (done) {
	async.parallel(this._onStop, function () {
		this._onStop = [];
		done();
	});
};

