exports.selector = function (selector) {
	var nameCap = /^(\w+)/.exec(selector)
		, classRe = /(\.|\!)(\w+)/g
		, classCap
		, result = {}
	if (nameCap) {
		result.name = nameCap[1];
	}
	result.classes = [];
	while (classCap = classRe.exec(selector)) {
		result.classes.push({ name: classCap[2], include: classCap[1] === '\.', exclude: classCap[1] === '!' });
	}
	return result;
};
