var _ = require('underscore');

module.exports = function (verbose, loglevel) {
	if (verbose) {
		if (_.isFunction(verbose)) {
			return function (lvl, val) {
				if (_.isNumber(lvl) && !!val) {
					if (lvl > loglevel) return;
					var args = Array.prototype.slice.call(arguments);
					args.shift();
					verbose.apply(null, args);
				}
				else {
					verbose.apply(null, arguments);
				}
			};
		}
		else {
			return function (lvl, val) {
				if (_.isNumber(lvl)) {
					if (lvl > loglevel) return;
					var args = Array.prototype.slice.call(arguments);
					args.shift();
					console.log.apply(null, args);
				}
				else {
					if (2 > loglevel) return;
					var args = Array.prototype.slice.call(arguments);
					args.shift();
					console.log.apply(null, args);
				}
			};
		}
	}
	return function () {};
};
