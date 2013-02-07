var should = require('should')
	, util = require('util')
	, _ = require('underscore')
	, fs = require('fs')
	, Lexer = require('../lib/lexer')
	, Parser = require('../lib/parser')
	, reset = true

describe('Parser', function () {
	it('basic lexing scenario', function (done) {
		var str = fs.readFileSync('test/signals/lexer.is', 'utf-8');
		var p = new Lexer(str);
		var res = p.read();
		var resStr = JSON.stringify(res, null, '\t');
		if (reset) fs.writeFileSync('test/signals/lexer.res', resStr, 'utf-8');
		var r = fs.readFileSync('test/signals/lexer.res', 'utf-8');
		(resStr === r).should.be.true;
		done();
	});
	it('advanced lexing scenario', function (done) {
		var str = fs.readFileSync('test/signals/lexer02.is', 'utf-8');
		var p = new Lexer(str);
		var res = p.read();
		var resStr = JSON.stringify(res, null, '\t');
		if (reset) fs.writeFileSync('test/signals/lexer02.res', resStr, 'utf-8');
		var r = fs.readFileSync('test/signals/lexer02.res', 'utf-8');
		(resStr === r).should.be.true;
		done();
	});
	it('declarative lexing scenario', function (done) {
		var str = fs.readFileSync('test/signals/lexer03.is', 'utf-8');
		var p = new Lexer(str);
		var res = p.read();
		var resStr = JSON.stringify(res, null, '\t');
		if (reset) fs.writeFileSync('test/signals/lexer03.res', resStr, 'utf-8');
		var r = fs.readFileSync('test/signals/lexer03.res', 'utf-8');
		//console.dir(_.map(res, function (e) { return { type: e.type, val: e.val, indent: e.indent }; }));
		(resStr === r).should.be.true;
		done();
	});
	it('declarative parse scenario', function (done) {
		var str = fs.readFileSync('test/signals/parser01.is', 'utf-8');
		var p = new Parser(str);
		var script = p.parse();
		var recreated = script.print();
		var p2 = new Parser(recreated);
		var script2 = p2.parse();
		var re2created = script2.print();
		(recreated === re2created).should.be.true;
		//console.log(util.inspect(res, null, null));
		done();
	});
});
