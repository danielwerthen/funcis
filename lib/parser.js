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

		function parseParams() {
			if (self.peek().type !== 'params') 
				return [];
			else {
				self.advance(); //throw away that params token
				var params = []
					, tok;
				while ((tok = self.advance()) && tok.type !== 'paramStop') {
					params.push(new Data(null, tok.val, tok.type));
				}
				return params;
			}
		}

		function parseFunc(name, selector, indent) {
			var tok = self.advance()
				, input = []
				, output = [];
			if (!indent) indent = tok.indent;
			//Pick out a name
			while (tok.type === 'func' || tok.type === 'selector') {
				switch (tok.type) {
					case 'func':
						name = tok.val;
						break;
					case 'selector':
						selector = tok.val;
						break;
				}
				tok = self.advance();
			}

			//Now we are expecting some params
			while (self.peek().type === 'params') {
				var params = parseParams();
				if (self.peek().type === 'callback') {
					self.advance(); // Get rid of the callback token
					output = params;
				}
				else {
					input = params;
				}
			}

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
