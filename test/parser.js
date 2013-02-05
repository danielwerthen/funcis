var should = require('should')
	, _ = require('underscore')
	, fs = require('fs')
	, Lexer = require('../lib/lexer')
	, reset = false

describe('Parser', function () {
	it('basic parse scenario', function (done) {
		var str = fs.readFileSync('test/signals/lexer.is', 'utf-8');
		var p = new Lexer(str);
		var res = p.read();
		var resStr = JSON.stringify(res, null, '\t');
		if (reset) fs.writeFileSync('test/signals/lexer.res', resStr, 'utf-8');
		var r = fs.readFileSync('test/signals/lexer.res', 'utf-8');
		(resStr === r).should.be.true;
		done();
	});
	it('advanced parse scenario', function (done) {
		var str = fs.readFileSync('test/signals/lexer02.is', 'utf-8');
		var p = new Lexer(str);
		var res = p.read();
		var resStr = JSON.stringify(res, null, '\t');
		if (reset) fs.writeFileSync('test/signals/lexer02.res', resStr, 'utf-8');
		var r = fs.readFileSync('test/signals/lexer02.res', 'utf-8');
		(resStr === r).should.be.true;
		done();
	});
	it('let parse scenario', function (done) {
		var str = fs.readFileSync('test/signals/lexer03.is', 'utf-8');
		var p = new Lexer(str);
		var res = p.read();
		var resStr = JSON.stringify(res, null, '\t');
		if (reset) fs.writeFileSync('test/signals/lexer03.res', resStr, 'utf-8');
		var r = fs.readFileSync('test/signals/lexer03.res', 'utf-8');
		//console.dir(_.map(res, function (e) { return { type: e.type, val: e.val }; }));
		(resStr === r).should.be.true;
		done();
	});
});
