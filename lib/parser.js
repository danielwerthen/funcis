var _ = require('underscore')
	, Lexer = require('./lexer')

var Parser = module.exports = function (str) {
	this.input = str;
	this.lexer = new Lexer(str);
	this.funcs = [];
}

var Func = function (selector, name, input, output) {
	this.selector = selector;
	this.name = name;
	this.input = input || [];
	this.output = output || [];
	this.callbacks = [];
}

var Data = function (name, val, type) {
	this.name = name;
	this.val = val;
	this.type = type;
}

Parser.prototype = {
	advance: function () {
		return this.lexer.advance();
	},

	parse: function () {
		var self = this
			, constants = {}
			, continuations = {}
			, functions = [];

		function parseFunc(name, selector) {

		}

		function parseDecl() {
			var name = self.advance().val;

			if (self.peek().type !== 'params') {
				if (constants[name]) {
					throw new error('Cannot have two constant declarations with the same name');
				}
				var cn = self.advance();
				constants[name] = new Data(name, cn.val, cn.type);
			}
			else {
				if (continuations[name]) {
					throw new error('Cannot have two continuation declarations with the same name');
				}
				continuations[name] = parseFunc(name);
			}
		}

		while (this.peek().type !== 'eos') {
			switch (this.peek().type) {
				case 'decl':

					break;
			}
		}
	},

	peek: function () {
		return this.lexer.lookahead(1);
	}
}
