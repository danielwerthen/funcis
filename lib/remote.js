var u2 = require('./utilities')
	, _ = require('underscore')
	, http = require('http')
	, writer = require('./socketWriter')
	, defaults = { host: 'localhost', port: 5000 };

var Remote = module.exports = function (con) {
	this.connection = _.extend({}, defaults, con);
	this.name = this.connection.host + ':' + this.connection.port;
	this.nodes = [];
};

Remote.prototype = {
	match: function (selector) {
					 return _.any(this.nodes, function (node) {
						 return u2.matcher.node(node.name, node.classes, selector);
					 });
				 },
	send: function (signature, exStack, done) {
					var req = http.request(_.extend({ path: '/call', method: 'POST' }, this.connection), function (res) {
					});
					var wr = writer(req);
					wr.write({ signature: signature, stack: exStack }, function (result) {
						if (result) return done();
						else return done('Failed in sending');
						req.end();
					});
				},
	addNode: function (name, classes) {
		var node = { name: name, classes: classes };
		this.nodes.push(node);
		return node;
	}
};
