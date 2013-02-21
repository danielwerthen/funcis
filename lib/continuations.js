module.exports = {
	"if": function () {
		var args = Array.prototype.slice.call(arguments);
		for (var i in args) {
			if (!args[i])
				return false;
		}
		return true;
	},
	"nif": function () {
		return !module.exports["if"].apply(null, arguments);
	}
};
