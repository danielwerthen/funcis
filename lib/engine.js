var _ = require('underscore')
	, EventEmitter = require('events').EventEmitter
	, directory = require('./directory')
	, defaultOptions = { verbose: false }

var Engine = module.exports = function (options) {
	this.opt = _.extend(defaultOptions, options);
	this.scripts = directory.create();
	this.nodes = directory.create();
	this.runners = {};

	this.scripts.on('added', _.bind(this._initScript, this));
	this.scripts.on('removed', _.bind(this._deinitScript, this));
};

Engine.prototype = {
	_log: function () {
		if (this.opt.verbose) {
			if (_.isFunction(this.opt.verbose))
				this.opt.verbose.apply(null, arguments);
			else
				console.log.apply(null, arguments);
		}
	},
	_initScript: function (name, script) {
		if (this.runners[name]) this.runners[name].stop();
		this.runners[name] = new Runner(name, script, this);
		this.runners[name].start();
		this._log('Initialized script: ' + name);
	},
	_deinitScript: function (name) {
		if (this.runners[name]) {
			this.runners[name].stop();
			this.runners[name] = undefined;
			this._log('Deinitialized script: ' + name);
		}
		else 
			this._log('Script not found: ' + name + '. Presumably a mistake has occured.');
	}
};

