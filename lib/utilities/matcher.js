var _ = require('underscore')
	, regs = require('./regs');

exports.node = function (name, classes, selector) {
	var sel = regs.selector(selector)
	if (sel.name && sel.name !== name) {
		return false;
	}
	return _.every(sel.classes, function (cl) {
		if (_.some(classes, function (e) {
			return e === cl.name;
		})) {
			if (cl.exclude) {
				return false;
			}
		}
		else if (cl.include) {
			return false;
		}
		return true;
	});
};
