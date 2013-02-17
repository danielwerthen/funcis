var _ = require('underscore')
	, EventEmitter = require('events').EventEmitter
	, directory = require('./directory')
	, Node = require('./node')
	, Runner = require('./runner')
	, u2 = require('./utilities')
	, listener = require('./listener')
	, Remote = require('./remote')
	, log = u2.log
	, async = u2.async
	, defaultOptions = { verbose: false, loglevel: 1 }

var Engine = module.exports = function (options) {
	var self = this;
	this.opt = _.extend({}, defaultOptions, options);
	this.scripts = directory.create();
	this.nodes = directory.create();
	this.runners = {};
	this.remotes = directory.create();

	this.scripts.on('added', _.bind(this._initScript, this));
	this.scripts.on('removed', _.bind(this._deinitScript, this));

	this.__log = log(this.opt.verbose, this.opt.loglevel);
	this._requests = new EventEmitter();

	this._requests.on('call', function (data) {
		self.handleData(data);
	});

};

Engine.prototype = {
	_log: function () {
		this.__log.apply(this, arguments);
	},
	createNode: function (name, classes) {
		var node;
		this.nodes.add(name, node = new Node(name, classes, this));
		return node;
	},
	listen: function (options) {
		return listener(_.extend(this.opt, options), this._requests);
	},
	connect: function (connection) {
						 var remote = new Remote(connection);
						 this.remotes.add(remote.name, remote);
						 return remote;
	},
	resolve: function (selector, locals) {
		var local = this.nodes.filter(function (name, node) {
			return node.match(selector);
		});
		if (locals)
			return local;
		return _.union(local, this.remotes.filter(function (name, remote) {
			return remote.match(selector);
		}));
	},
	handleData: function (data) {
		if (data.signature && _.isString(data.signature)) {
			var runs = _.filter(_.values(this.runners), function (run) {
				return run.script.signature === data.signature;
			});
			_.each(runs, function (run) {
				run.execute(data.stack, true, function (err) {
				});
			});
		}
		else {
			callback('Bad data');
		}
	},
	_initScript: function (name, script) {
		var self = this;
		if (this.runners[name]) this.runners[name].stop();
		this.runners[name] = new Runner(name, script, this);
		this._log(2, 'Initializing script: ' + name);
		this.runners[name].start(function () {
			self._log(2, 'Script is running: ' + name);
		});
	},
	_deinitScript: function (name) {
		if (this.runners[name]) {
			this.runners[name].stop();
			this.runners[name] = undefined;
			this._log(2, 'Deinitialized script: ' + name);
		}
		else 
			this._log('Script not found: ' + name + '. Presumably a mistake has occured.');
	}
};

