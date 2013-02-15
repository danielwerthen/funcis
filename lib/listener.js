var reader = require('./socketReader')
	, _ = require('underscore')
	, path = require('path')

module.exports = function (options, cEvents) {
	var basePath = options.basePath || ''
		, delimiter = options.delimiter || reader.defaults.delimiter
		, encoding = options.encoding || reader.defaults.encoding
		, log = options.logger || function () {}
		, commandReg = new RegExp('^' + path.join(basePath, '/') + '([^\?]*)')

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
			log(1, 'Received ping request');
			reader.readToEnd(req, options, function (err, datas) {
				if (err || !datas.length) {
					return fail('Bad request');
				}
				var top = datas[0];
				return _return({ time: top.time });
			});
		}
		else if (matches(req.url, 'call')) {
			log(1, 'Received call request');
		}
	};
};

