var http = require('http')
	, https = require('https')
	, _ = require('lodash')
	, path = require('path')
	, writer = require('./socketWriter')
	, defaults = { host: 'localhost'
		, protocol: 'http'
			, basepath: '/funcis'
			, retries: 5
			, retryDelay: 250
			, rejectUnauthorized: true
			, agent: false }

var Connection = module.exports = function (opt) {
	this.options = _.extend({}, defaults, opt);
	this._connectOpt = _.pick(this.options
			, 'host'
			, 'port'
			, 'headers'
			, 'auth'
			, 'pfx'
			, 'key'
			, 'passphrase'
			, 'cert'
			, 'ca'
			, 'ciphers'
			, 'rejectUnauthorized'
			, 'agent');
	this._proto = http;
	if (this.options.protocol === 'https') {
		this._proto = https;
		if (!this._connectOpt.port)
			this._connectOpt.port = 443;
	}
	else {
		if (!this._connectOpt.port)
			this._connectOpt.port = 80;
	}
	this._connectOpt.path = path.join(this.options.basepath, '/call');
	this._connectOpt.method = 'POST';
	this._writer;
	this._req;
};

Connection.prototype = {
	connect: function () {
		this._req = this._proto.request(this._connectOpt);
		this._writer = writer(this._req);
	},
	send: function (state, done, retries) {
		var self = this;
		if (!this._writer || !this._writer.canWrite) {
			this.connect();
		}
		this._writer.write(state, function (result) {
			if (result) return done();
			if (retries < self.options.retries)
				return setTimeout(function () {
					self.send(state, done, (retries || 0) + 1);
				}, self.options.retryDelay);
			return done('Unable to send');
		});
	}
};
