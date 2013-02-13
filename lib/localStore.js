var LocalStore = module.exports = function (context, key) {
	this.context = context;
};

LocalStore.prototype = {
	get: function (key) { 
		var store = this.context._locals[key];
		if (!store)
			return undefined;
		return store[key];
	}
	, set: function (key, val) { 
		var store = this.context._locals[key];
		if (!store)
			store = this.context._locals[key] = {};
		store[key] = val;
	}
};
