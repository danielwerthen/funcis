var _ = require('underscore')
	, defaults = { delimiter: '::', encoding: 'utf8', parser: JSON.parse };

exports.defaults = defaults;

exports.read = function read(socket, options, callback) {
	var self = this
		, callback = _.isFunction(options) ? options : callback
		, delimiter = options.delimiter || defaults.delimiter
		, encoding = options.encoding || defaults.encoding
		, parser = options.parser || defaults.parser
		, reg = new RegExp('^(.+?)' + delimiter, 'g')
		, buffer = '';

	var _callback = function () {
		var args = arguments;
		_.defer(function () {
			callback.apply(null, args);
		});
	};

	if (socket.setEncoding) socket.setEncoding(encoding);
	socket.on('data', function (chunk) {
		var cap
			, data;
		buffer += chunk;
		while (cap = reg.exec(buffer)) {
			buffer = buffer.substr(cap[0].length);
			data = null;
			try {
				data = parser(cap[1]);
			} catch (e) {
				return _callback(e);
			}
			_callback(null, data);
		}
	});
}
