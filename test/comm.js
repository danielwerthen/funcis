var should = require('should')
	, util = require('util')
	, _ = require('underscore')
	, https = require('https')
	, fs = require('fs')
	, Parser = require('../lib/parser')
	, Lexer = require('../lib/lexer') 
	, Engine = require('../lib/engine')
	, nodeAkey = fs.readFileSync('test/crypto/keys/nodea.key')
	, nodeAcert = fs.readFileSync('test/crypto/certs/nodea.crt')
	, nodeBkey = fs.readFileSync('test/crypto/keys/nodeb.key')
	, nodeBcert = fs.readFileSync('test/crypto/certs/nodeb.crt')
	, ca = fs.readFileSync('test/crypto/ca/ca.crt')

describe('Engine communication', function () {
	it('crypto', function (done) {
		var str = fs.readFileSync('test/signals/comm01.is', 'utf-8');
		var script = new Parser(str).parse();

		var engine1 = new Engine({ verbose: true, loglevel: 4 });
		var engine2 = new Engine({ verbose: true, loglevel: 4 });

		var nodeA = engine1.createNode('NodeA', []);
		var t0;
		nodeA.functions.add('Start', function (arg1, cb) {
			t0 = Date.now();
			cb(arg1);
		});
		nodeA.functions.add('Incr', function (arg, cb) {
			cb(arg + 1);
		});
		nodeA.functions.add('End', function (arg1, arg2, cb) {
			(arg1 === arg2).should.be.true;
			//console.dir('Time: ' + (Date.now() - t0));
			done();
		});
		nodeA.functions.add('Noop', function (cb) {
			cb();
		});

		var nodeB = engine2.createNode('NodeB', []);
		nodeB.functions.add('Noop', function (cb) {
			cb();
		});
		nodeB.functions.add('Incr', function (arg, cb) {
			cb(arg + 1);
		});

		https.createServer({ key: nodeBkey
			, cert: nodeBcert
			, ca: ca
			, requestCert: true
			, rejectUnauthorized: true
		}, engine2.listen()).listen(7001);
		https.createServer({ key: nodeAkey
			, cert: nodeAcert
			, ca: ca
			, requestCert: true
			, rejectUnauthorized: true
		}, engine1.listen()).listen(7002);

		var remote2 = engine1.connect({ port: 7001
			, protocol: 'https'
			, key: nodeAkey
			, cert: nodeAcert
	 		, ca: ca
			, agent: false });
		remote2.addNode('NodeB', []);
		var remote1 = engine2.connect({ port: 7002
			, protocol: 'https'
			, key: nodeBkey
			, cert: nodeBcert
	 		, ca: ca
			, agent: false });
		remote1.addNode('NodeA', []);

		engine1.scripts.add('Engine04A', script);
		engine2.scripts.add('Engine04B', script);

	});
});
