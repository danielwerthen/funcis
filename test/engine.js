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
			this.next.apply(null, args);
		});
		engine.scripts.add('Engine01', script);
		done();
	});
	it('Lets see what it can do script', function (done) {
		var str = fs.readFileSync('test/signals/engine02.is', 'utf-8');
		var input = fs.readFileSync('test/signals/input02.txt', 'utf-8');
		var p = new Parser(str);
		var script = p.parse();
		var engine = new Engine({ verbose: true });
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
		node.functions.add('Begin', function () {
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
						self.global.set('store', {});
						run(N + 10, fin);
					};
					begin(self.next, N);
				});
			};
			run(c, function (N, t1, t2, res1, res2) {
				(_.isEqual(res1,res2)).should.be.true;
				console.dir('N: ' + N + ' rate: ' + (t2 / t1) + ' Res2: ' + t2);
			});
		});
		node.functions.add('Count', function (word) {
			count(this.next, this.global, word);
		});
		node.functions.add('Match', function (result) {
			fin2(Date.now() - t0, result);
		});
		engine.scripts.add('Engine02', script);
	});
});
