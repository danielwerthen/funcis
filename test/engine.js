var should = require('should')
	, util = require('util')
	, _ = require('underscore')
	, http = require('http')
	, fs = require('fs')
	, Parser = require('../lib/parser')
	, Lexer = require('../lib/lexer') , Engine = require('../lib/engine')

describe('Engine', function () {
	it('engine to engine communication', function (done) {
		var str = fs.readFileSync('test/signals/engine04.is', 'utf-8');
		var script = new Parser(str).parse();

		var engine1 = new Engine({ verbose: true, loglevel: 5 });
		var engine2 = new Engine({ verbose: true, loglevel: 5 });

		var nodeA = engine1.createNode('NodeA', []);
		nodeA.functions.add('Add', function (arg1, arg2, cb) {
			cb(arg1 + arg2);
		});

		var nodeB = engine2.createNode('NodeB', []);
		nodeB.functions.add('Print', function (first, cb) {
			(first === 9).should.be.true;
			done();
		});

		http.createServer(engine2.listen()).listen(8001);

		var remote = engine1.connect({ port: 8001 });
		remote.addNode('NodeB', []);

		engine1.scripts.add('Engine04A', script);
		engine2.scripts.add('Engine04B', script);

	});
	it('simple script', function (done) {
		var str = fs.readFileSync('test/signals/engine01.is', 'utf-8');
		var t = new Lexer(str);
		var p = new Parser(str);
		var tt = t.read();
		//console.dir(tt);
		var script = p.parse();
		//console.log(util.inspect(script, false, 100));
		var engine = new Engine({ verbose: true });
		var node = engine.createNode('NodeA', [ 'Revn', 'Kiln' ]);
		node.functions.add('Print', function (arg1, arg2, cb) {
			var args = Array.prototype.slice.call(arguments);
			cb.apply(null, args);
		});
		engine.scripts.add('Engine01', script);
		done();
	});
	it('conditional script', function (done) {
		var str = fs.readFileSync('test/signals/engine05.is', 'utf-8');
		var p = new Parser(str);
		var script = p.parse();
		//console.log(util.inspect(script, false, 100));
		var engine = new Engine({ verbose: true });
		var node = engine.createNode('NodeA', [ 'Revn', 'Kiln' ]);
		node.functions.add('Add', function (arg1, arg2, cb) {
			cb(arg1 + arg2);
		});
		node.functions.add('Subtract', function (arg1, arg2, cb) {
			cb(arg1 - arg2);
		});
		node.functions.add('Multi', function (arg1, arg2, cb) {
			cb(arg1 * arg2);
		});
		node.functions.add('Div', function (arg1, arg2, cb) {
			cb(arg1 / arg2);
		});
		var equals = 0;
		node.functions.add('Equal', function (arg1, arg2, cb) {
			(arg1 === arg2).should.be.true;
			if (++equals >= script.functions.length)
				done();
		});
		engine.scripts.add('Engine05', script);
	});
	it('advanced script', function (done) {
		var str = fs.readFileSync('test/signals/engine03.is', 'utf-8');
		var p = new Parser(str);
		var script = p.parse();
		//console.log(util.inspect(script, false, 100));
		var engine = new Engine({ verbose: true });
		var node = engine.createNode('NodeA', [ 'Revn', 'Kiln' ]);
		node.functions.add('Add', function (arg1, arg2, cb) {
			cb(arg1 + arg2);
		});
		node.functions.add('Subtract', function (arg1, arg2, cb) {
			cb(arg1 - arg2);
		});
		node.functions.add('Multi', function (arg1, arg2, cb) {
			cb(arg1 * arg2);
		});
		node.functions.add('Div', function (arg1, arg2, cb) {
			cb(arg1 / arg2);
		});
		var equals = 0;
		node.functions.add('Equal', function (arg1, arg2, cb) {
			(arg1 === arg2).should.be.true;
			if (++equals >= script.functions.length)
				done();
		});
		engine.scripts.add('Engine03', script);
	});
	it('Lets see what it can do script', function (done) {
		var str = fs.readFileSync('test/signals/engine02.is', 'utf-8');
		var input = fs.readFileSync('test/signals/input02.txt', 'utf-8');
		var p = new Parser(str);
		var script = p.parse();
		//console.log(util.inspect(script, false, 100));
		var engine = new Engine({ verbose: true, loglevel: 1 });
		var node = engine.createNode('NodeA', [ 'Revn', 'Kiln' ]);
		
		function begin(next, iterations) {
			var data = input.split(' ');
			for (var j = 0; j < iterations; j++) {
			for (var i in data) {
				next(data[i]);
			}
			}
			next(null);
		}

		function count(next, local, word) {
			var store = local.get('store');
			if (!store) {
				local.set('store', store = {});
			}
			if (!word) {
				next(store);
				return;
			}
			if (store[word] > 0)
				store[word]++;
			else
				store[word] = 1;
		}

		function iterate(N, fin) {
			var st = {};
			var t00 = Date.now();
			begin(function (word) {
				count(function (res) {
					fin(Date.now() - t00, res);
				}, { get: function () { return st; } }, word);
			}, N);
		}

		var t0 = Date.now()
			, fin2;
		node.functions.add('Begin', function (cb) {
			var self = this;
			var c = 1;
			var run = function (N, fin) {
				if (N > c) {
					done();
					return;
				}
				iterate(N, function (t1, res1) {
					fin2 = function(t2, res2) {
						fin(N, t1, t2, res1, res2);
						self.set('store', {});
						run(N + 10, fin);
					};
					begin(cb, N);
				});
			};
			run(c, function (N, t1, t2, res1, res2) {
				(_.isEqual(res1,res2)).should.be.true;
				console.dir('N: ' + N + ' rate: ' + (t2 / t1) + ' Res2: ' + t2);
			});
		});
		node.functions.add('Count', function (word, cb) {
			count(cb, this, word);
		});
		node.functions.add('Match', function (result) {
			fin2(Date.now() - t0, result);
		});
		engine.scripts.add('Engine02', script);
	});
});
