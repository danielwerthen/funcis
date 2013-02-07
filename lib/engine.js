var _ = require('underscore')
	, util = require('./util')
	, Parser = require('./parser')
	, EventEmitter = require('events').EventEmitter
	, defaultOptions = {}

var Engine = module.exports = function (options) {
	this.opt = _.extend(defaultOptions, options);
};

Engine.prototype = {
};
