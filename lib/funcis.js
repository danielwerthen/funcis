var Engine = require('./engine')
	, fs = require('fs')
	, _ = require('lodash')
	, files = require('./utilities').files
	, defaults = { scriptPath: './scripts', ext: '.is' }

exports = module.exports = function (options) {
	var hold = new Holder(options);
	return hold;
};

var Holder = function (options) {
	this.options = _.extend({}, defaults, options);
	this.engine = new Engine(options);
};

Holder.prototype = {
	listen: function (options) {
		return this.engine.listen(options);
	},
	connect: function (connection) {
		return this.engine.connect(connection);
	},
	node: function (name, classes) {
		return this.engine.createNode(name, classes);
	},
	script: function (path) {
		var name = files.lookup(path, this.options);
		if (!name) throw new Error('Could not find script ' + path);
		var data = fs.readFileSync(name, 'utf8');
		this.engine.scripts.add(name, data);
	}
};
