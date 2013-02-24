var u2 = require('./utilities')
	, _ = require('underscore')
	, http = require('http')
	, Connection = require('./connection')

var Remote = module.exports = function (con) {
	this.connection = new Connection(con);
	this.name = this.connection.options.host + ':' + this.connection.options.port;
	this.nodes = [];
};

Remote.prototype = {
	match: function (selector) {
		return _.any(this.nodes, function (node) {
		 return u2.matcher.node(node.name, node.classes, selector);
		});
	},
	send: function (state, done) {
		this.connection.send(state, done);
	},
	addNode: function (name, classes) {
		var node = { name: name, classes: classes };
		this.nodes.push(node);
		return node;
	}
};
