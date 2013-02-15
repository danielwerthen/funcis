var should = require('should')
	, util = require('util')
	, _ = require('underscore')
	, fs = require('fs')
	, Node = require('../lib/node')

describe('Node', function () {
	it('should match these selectors', function () {
		var n1 = new Node('NodeA', [ 'Calc', 'Print' ]);
		n1.match('NodeA').should.be.true;
		n1.match('NodeA.Calc').should.be.true;
		n1.match('NodeA.Calc!Resolv').should.be.true;
		n1.match('NodeA.Calc!Print').should.be.false;
		n1.match('NodeB.Calc!Print').should.be.false;
		n1.match('.Calc!Print').should.be.false;
		n1.match('.Calc.Print').should.be.true;
	});
});
