var _ = require('underscore')
	, EventEmitter = require('events').EventEmitter;

exports.create = function () {
	var self = {
		items: {}
	};
	var obj = {
		add: function (key, item) {
			if (self.items[key])
				throw new Error('That directory key is already in use');
			self.items[key] = item;
			obj.emit('added', key, item);
		},
		remove: function (key) {
			if (self.items[key]) {
				self.items[key] = undefined;
				obj.emit('removed', key);
			}
		},
		filter: function (iterator, context) {
			var results = [];
			if (self.items == null) return results;
			_.each(_.keys(self.items), function (key) {
				var value = self.items[key];
				if (iterator.call(context, key, value)) results[results.length] = value;
			});
			return results;
		},
		get: function (key) {
			return self.items[key];
		}
	};

	return _.extend(obj, new EventEmitter());
};
