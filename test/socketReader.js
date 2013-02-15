var should = require('should')
	, util = require('util')
	, _ = require('underscore')
	, http = require('http')
	, reader = require('../lib/socketReader')

describe('SocketReader', function () {
	it('simple IO', function (done) {
		var toSend = [ '{ "message": "Test1:" }', '{ "message": "Test2" }', '{ "message": "Test3" }'];
		var srv = http.createServer(function (req, res) {
			reader.read(req, function (err, data) {
				(!!err).should.be.false;
				(!!data).should.be.true;
			});
		});
		srv.listen(9000);

		var req = http.request({ host: 'localhost', port: 9000, path: '/', method: 'POST' }, function (res) {
		});
		_.each(toSend, function (msg) {
			req.write(msg + reader.defaults.delimiter);
		});
		req.end();
		done();
	});
});
