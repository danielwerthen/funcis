var _ = require('underscore')
	, EventEmitter = require('events').EventEmitter
	, directory = require('./directory')
	, Node = require('./node')
	, Runner = require('./runner')
	, u2 = require('./utilities')
	, listener = require('./listener')
	, log = u2.log
	, async = u2.async
	, defaultOptions = { verbose: false, loglevel: 1 }

var Engine = module.exports = function (options) {
	this.opt = _.extend(defaultOptions, options);
	this.scripts = directory.create();
	this.nodes = directory.create();
	this.runners = {};
	this.remotes = directory.create();

	this.scripts.on('added', _.bind(this._initScript, this));
	this.scripts.on('removed', _.bind(this._deinitScript, this));

	this.__log = log(this.opt.verbose, this.opt.loglevel);
	this._requests = new EventEmitter();

};

Engine.prototype = {
	_log: function () {
		this.__log.apply(this, arguments);
	},
	_err: function () {
		this._log.apply(this, arguments);
	},
	createNode: function (name, classes) {
		var node;
		this.nodes.add(name, node = new Node(name, classes, this));
		return node;
	},
	listen: function (options) {
		return listener(_.extend(this.opt, options), this._requests);
	},
	resolve: function (selector, locals) {
		var local = this.nodes.filter(function (name, node) {
			return node.match(selector);
		});
		if (locals)
			return local;
		return _.union(local, this.remotes.filter(function (remote) {
			return remote.match(selector);
		}));
	},
	handleData: function (data, callback) {
		if (_.isArray(data)) {
			var top = data[data.length - 1];
			if (!top.signature || !_.isString(top.signature)) {
				return callback('Bad data');
			}
			var runs = this.runners.filter(function (name, run) {
				return run.script.signature === data.signature;
			});
			var done = async.combine(runs.length, callback);
			_.each(runs, function (run) {
				run.execute(data, done);
			});
		}
		else if (!!data) {
			this.handleData([data], callback);
		}
	},
	_initScript: function (name, script) {
		var self = this;
		if (this.runners[name]) this.runners[name].stop();
		this.runners[name] = new Runner(name, script, this);
		this._log(2, 'Initializing script: ' + name);
		this.runners[name].start(function () {
			self._log(1, 'Script is running: ' + name);
		});
	},
	_deinitScript: function (name) {
		if (this.runners[name]) {
			this.runners[name].stop();
			this.runners[name] = undefined;
			this._log(1, 'Deinitialized script: ' + name);
		}
		else 
			this._log('Script not found: ' + name + '. Presumably a mistake has occured.');
	}
};

