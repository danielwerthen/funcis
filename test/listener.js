var should = require('should')
	, util = require('util')
	, _ = require('underscore')
	, http = require('http')
	, listener = require('../lib/listener')

describe('Listener', function () {
	it('simple IO', function (done) {
		done();
		return;
		var srv = http.createServer(listener({
			logger: function (num, str) { console.dir(str); }
		}));
		srv.listen(9001);

		var req = http.request({ host: 'localhost', port: 9001, path: '/ping', method: 'POST' }, function (res) {
		});
		req.write(JSON.stringify({ time: Date.now() }));
		req.end();
		done();
	});
});
