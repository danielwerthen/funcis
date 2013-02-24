var _ = require('lodash')
	, async = require('async')
	, resolver = require('./resolver')
	, Context = require('./context')

var Interp = module.exports = function (script, engine) {
	this.script = script;
	this.engine = engine;
	this.context = new Context();
};

Interp.prototype = {
	start: function (cb) {
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
	stop: function (cb) {
		this.context.stop(cb);
	},
	exit: function (state, args, cb) {
		var func = this.script._traverse(state.pos)
			, self = this;
		if (!func) {
			return cb('Bad position traversal in exit');
		}
		if (!func.callbacks.length && !!state.parent) {
			return this.exit(state.parent, args, cb);
		}
		async.parallel(_.map(func.callbacks, 
			function (callback, id) {
				return function (done) {
					var nextState = State.prototype.next.call(state, func, state, args, id);
					self.enter(nextState, false, done);
				};
			}), cb);
	},
	enterContinuation: function (name, state, args, cb) {
		var cont = this.script.continuations[name]
			, id = this.script.getContId(name);
		if (!cont || !id) {
			return cb('Failed to find continuation');
		}
		var newState = new State(id, this.script.signature);
		newState.parent = state;
		this.exit(newState, args, cb);
	},
	enter: function (state, local, cb) {
		var func = this.script._traverse(state.pos);
		if (!func) {
			return cb('Bad position traversal in entry');
		}
		if (!func.selector) {
			var args = resolver.args(func, state.stack, this.script.constants);
			return this.enterContinuation(func.name, state, args, cb);
		}
		var nodes = this.engine.resolve(func.selector, local);
		if (!nodes.length) { return cb(); }
		var args = resolver.args(func, state.stack, this.script.constants);
		async.parallel(_.map(nodes, 
			function (node) {
				return function (done) {
					if (node.executable) {
						_.defer(function () {
							node.execute(func.name, args, state, done);
						});
					} else {
						node.send(state, done);
					}
				};
			}), cb);
	}
};

var State = function (id, signature) {
	if (_.isArray(id))
		this.pos = id;
	else
		this.pos = [ Number(id) ];
	this.signature = signature;
	this.stack = {};
	this.parent = null;
};

State.prototype = {
	next: function (func, state, args, id) {
		var next = new State(this.pos.concat(Number(id)), this.signature);
		next.stack = _.pick(state.stack, func.passalongs);
		next.parent = this.parent;
		_.each(func.output, function (param, id) {
			next.stack[param.val] = args[id];
		});
		return next;
	}
};
