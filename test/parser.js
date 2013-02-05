var should = require('should')
	, _ = require('underscore')
	, fs = require('fs')
	, Lexer = require('../lib/lexer')

describe('Parser', function () {
	it('basic parse scenario', function (done) {
		var str = fs.readFileSync('test/signals/lexer.is', 'utf-8');
		var p = new Lexer(str);
		var res = p.read();
		var resStr = JSON.stringify(res, null, '\t');
		var r = fs.readFileSync('test/signals/lexer.res', 'utf-8');
		(resStr === r).should.be.true;
		done();
	});
	it('advanced parse scenario', function (done) {
		var str = fs.readFileSync('test/signals/lexer02.is', 'utf-8');
		var p = new Lexer(str);
		var res = p.read();
		var resStr = JSON.stringify(res, null, '\t');
		var r = fs.readFileSync('test/signals/lexer02.res', 'utf-8');
		(resStr === r).should.be.true;
		done();
	});
});
