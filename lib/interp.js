var _ = require('lodash')
	, async = require('async')
	, resolver = require('./resolver');

var Interp = module.exports = function (script, engine) {
	this.script = script;
	this.engine = engine;
};

Interp.prototype = {
	runInitials: function (cb) {
		var self = this;
		if (!self.script.functions.length) {
			return cb();
		}
		async.parallel(_.map(self.script.functions,
			function (fc, id) {
				return function (done) {
					self.enter(new State(id, self.script.signature), true, done);
				};
			}), cb);
	},
	enter: function (state, local, cb) {
		var func = this.script._traverse(state.pos);
		if (!func) {
			return cb('Bad position traversal');
		}
		if (!func.selector) {
			return this.enterContinuation(func.name, state, cb);
		}
		var args = resolver.args(func, state.stack, this.script.constants);
		var nodes = engine.resolve(func.selector, local);
		if (!nodes.length) { return cb(); }
		async.parallel(_.map(nodes, 
			function (node) {
				return function (done) {
					if (node.executable) {
						node.execute(func.name, args, state, done);
					} else {
						node.send(state, done);
					}
				};
			}), cb);
	}
};

var State = function (id, signature) {
	this.pos = '' + id;
	this.signature = signature;
	this.stack = {};
	this.parent = null;
};
