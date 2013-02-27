var utils = require('util')
	, paths = require('path')
	, fs = require('fs')
	, exists = fs.existsSync || path.existsSync
	, root = paths.dirname(require.main.filename)

exports.lookup = function (str, options) {
	var ext = paths.extname(str)
		, path = paths.join(options.scriptPath, str);
	if (!ext) path += (ext = options.ext);
	if (!exports.isAbsolute(path)) path = paths.join(root, path);
	if (exists(path)) return path;
};

exports.isAbsolute = function(path){
	if ('/' == path[0]) return true;
	if (':' == path[1] && '\\' == path[2]) return true;
};
