var _ = require('underscore')
	, defaults = { 
		delimiter: '::'
		, replacer: ':'
		, encoding: 'utf8'
		, parser: JSON.parse 
		, logger: function (lvl, val) { if (lvl === 1) console.dir(val); }
	};

exports.defaults = defaults;

exports.readToEnd = function readToEnd(socket, options, callback) {
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
	});
	socket.on('end', function () {
		var cap
			, data
			, datas = [];
		while (cap = reg.exec(buffer)) {
			buffer = buffer.substr(cap[0].length);
			data = null;
			try {
				data = parser(cap[1]);
			} catch (e) {
				return _callback(e);
			}
			datas.push(data);
		}
		if (buffer.length > 0) {
			data = null;
			try {
				data = parser(buffer);
			} catch (e) {
				return _callback(e);
			}
			datas.push(data);
		}
		_callback(null, datas);
	});
};

exports.read = function read(socket, options, callback, end) {
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
	socket.on('end', function () {
		var cap
			, data;
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
		if (buffer.length > 0) {
			data = null;
			try {
				data = parser(buffer);
			} catch (e) {
				return _callback(e);
			}
			_callback(null, data);
		}
	});
}
