var should = require('should')
	, fs = require('fs')
	, Parser = require('../lib/parser')

describe('Parser', function () {
	it('should test OK', function (done) {
		var str = fs.readFileSync('test/signals/test.is', 'utf-8');
		var p = new Parser(str);
		p.test();
		done();
	});
});
