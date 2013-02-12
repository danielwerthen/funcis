var should = require('should')
	, util = require('util')
	, _ = require('underscore')
	, fs = require('fs')
	, Parser = require('../lib/parser')
	, Lexer = require('../lib/lexer')
	, Engine = require('../lib/engine')

describe('Engine', function () {
	it('simple script', function (done) {
		var str = fs.readFileSync('test/signals/engine01.is', 'utf-8');
		var t = new Lexer(str);
		var p = new Parser(str);
		var tt = t.read();
		//console.dir(tt);
		var script = p.parse();
		var engine = new Engine({ verbose: true });
		var node = engine.createNode('NodeA', [ 'Revn', 'Kiln' ]);
		node.functions.add('Print', function (arg1, arg2) {
			var args = Array.prototype.slice.call(arguments);
			console.log(args.join(', '));
			this.next.apply(null, args);
		});
		engine.scripts.add('Engine01', script);
		done();
	});
});
