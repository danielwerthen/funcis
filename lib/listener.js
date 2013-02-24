var reader = require('./socketReader')
	, _ = require('underscore')
	, path = require('path')
module.exports = function (options, requests) {
	var basePath = options.basePath || '/funcis'
		, delimiter = options.delimiter || reader.defaults.delimiter
		, encoding = options.encoding || reader.defaults.encoding
		, commandReg = new RegExp('^' + 
				path.join(basePath, '/').replace('\\', '/')
			 	+ '([^\?]*)'); //Ugliness to support escaped backslashes in windows

	function matches(url, command) {
		var cap;
		if (cap = commandReg.exec(url)) return cap[1] === command;
	}

	return function (req, res, next) {
		var fail = _.once(function (str) {
			res.writeHead('400', { 'Content-Type': 'text/plain' });
			return res.end(str);
		});

		var _return = _.once(function (data) {
			if (_.isString(data)) {
				res.writeHead('200', { 'Content-Type': 'text/plain' });
				return res.end(data);
			}
			else {
				res.writeHead('200', { 'Content-Type': 'application/json' });
				return res.end(JSON.stringify(data));
			}
		});
		
		if (matches(req.url, 'ping')) {
			requests.emit('ping');
			reader.readToEnd(req, options, function (err, datas) {
				if (err || !datas.length) {
					return fail('Bad request');
				}
				var top = datas[0];
				return _return({ time: top.time });
			});
		}
		else if (matches(req.url, 'call')) {
			reader.read(req, options, function (err, data) {
				if (err) return requests.emit('error', err);
				requests.emit('call', data);
			});
		}
		else {
			_return('Failed');
		}
	};
};

