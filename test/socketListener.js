var should = require('should')
	, util = require('util')
	, _ = require('underscore')
	, http = require('http')
	, reader = require('../lib/socketReader')
	, writer = require('../lib/socketWriter')

describe('SocketWriter', function () {
	it('simple IO', function (done) {
		var toSend = [ '{ "message": "Test1::" }', '{ "message": "Test2" }', '{ "message": "Test3" }'];
		var srv = http.createServer(function (req, res) {
			reader.read(req, function (err, data) {
				(!!err).should.be.false;
				(!!data).should.be.true;
			});
		});
		srv.listen(9002);

		var req = http.request({ host: 'localhost', port: 9003, path: '/', method: 'POST' }, function (res) {
		});
		var wr = writer(req);
		_.each(toSend, function (msg) {
			wr.write(msg, function (res) {
				res.should.be.false;
			});
		});
		req.end();
		var req = http.request({ host: 'localhost', port: 9002, path: '/', method: 'POST' }, function (res) {
		});
		var wr = writer(req);
		_.each(toSend, function (msg) {
			wr.write(msg, function (res) {
				res.should.be.true;
			});
		});
		req.end();
		done();
	});
});
