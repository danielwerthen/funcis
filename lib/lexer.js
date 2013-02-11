var _ = require('underscore');

var Lexer = module.exports = function (str) {
	this.input = str.replace(/\r\n|\r/g, '\n');
	this.lineno = 1;
	this.indentLvl = 0;
	this.indentsPrev = 0;
	this.indentRegex = null;
	this.params = false;
	this.spaceLn = 0;
	this.stash = [];
}

Lexer.prototype = {
	tok: function (type, val, subtype) {
		return {
			type: type , line: this.lineno , val: val
				, indent: this.indentLvl
				, subtype: subtype
		};
	},

	consume: function (len) {
		this.input = this.input.substr(len);
	},

	scan: function (regex, type, subtype) {
		var cap;
		if (cap = regex.exec(this.input)) {
			this.consume(cap[0].length);
			return this.tok(type, cap[1], subtype);
		}
	},

	stashed: function() {
		return this.stash.length
			&& this.stash.shift();
	},

  lookahead: function(n){
    var fetch = n - this.stash.length;
    while (fetch-- > 0) this.stash.unshift(this.next());
    return this.stash[--n];
  },

	advance: function() {
		return this.stashed()
			|| this.next();
	},

	indent: function () {
		var cap, re;

		if (this.indentRegex) {
			cap = this.indentRegex.exec(this.input);
		} else {
			re = /^\n(\t*) */;
			cap = re.exec(this.input);

			if (cap && !cap[1].length) {
				re = /^\n( *)/;
				cap = re.exec(this.input);
				this.spaceLn = cap[1].length;
			}

			if (cap && cap[1].length) this.indentRegex = re;
		}
		if (cap) {
			var tok
				, indents = cap[1].length;

			++this.lineno;
			this.consume(indents + 1);

			if (this.spaceLn) {
				if (indents % this.spaceLn != 0) {
					throw new Error('Invalid spacing at line ' + this.lineno);
				}
				indents = indents / this.spaceLn;
			}

			if (' ' == this.input[0] || '\t' == this.input[0]) {
				throw new Error('Invalid indentation, you can use tabs or spaces but not both');
			}

			if ('\n' == this.input[0]) return this.tok('newline');

			// outdent
			if (this.indentLvl && indents < this.indentLvl) {
				while (this.indentLvl > indents) {
					this.stash.push(this.tok('outdent'));
					--this.indentLvl;
				}
				tok = this.stash.pop();
			}
			// indent
			else if (indents && indents != this.indentLvl) {
				this.indentLvl = indents;
				tok = this.tok('indent', indents);
			}
			// newline
			else {
				tok = this.tok('newline');
			}
			return tok;
		}
	},

	eos: function () {
		if (this.input.length) return;
		if (this.indentLvl) {
			var tok = this.tok('outdent');
			this.indentLvl--;
			return tok;
		} else {
			return this.tok('eos');
		}
	}, 

	blank: function() {
		var captures;
		if (captures = /^\n *\n/.exec(this.input)) {
			this.consume(captures[0].length - 1);
			++this.lineno;
			return this.next();
		}
	},

	func: function () {
		return this.scan(/^(\w+) */, 'func');
	},

	selector: function () {
		return this.scan(/^([\w\.\!]+)\./, 'selector');
	},

	decl: function () {
		var cap;
		if (cap = /^let *([A-Za-z]\w+) *= */.exec(this.input)) {
			if (this.indentLvl > 0) {
				throw new Error("Declarations must be top level");
			}
			this.consume(cap[0].length);
			if (!/^ *\(/.exec(this.input)) {
				this.params = true;
				this.stash.push(this.param());
				this.params = false;
				return this.tok('const', cap[1]);
			}
			else {
				return this.tok('cont', cap[1]);
			}
		}
	},

	numVal: function () {
		return this.scan(/^\s*,?\s*(\d+) */, 'param', 'num');
	},

	stringVal: function () {
		var cap;
		if (cap = /^(\s*,?\s*)\"/.exec(this.input)) {
			this.consume(cap[1].length);
			for (var i = 1; i < this.input.length; i++) {
				if (this.input[i] === '\"' && this.input[i - 1] !== '\\') {
					var tok = this.tok('param', this.input.substr(1, i - 1).replace(/\\\"/g, '\"'), 'string');
					this.consume(i + 1);
					return tok;
				}
			}
		} else if (cap = /^(\s*,?\s*)\'/.exec(this.input)) {
			this.consume(cap[1].length);
			for (var i = 1; i < this.input.length; i++) {
				if (this.input[i] === '\'' && this.input[i - 1] !== '\\') {
					var tok = this.tok('param', this.input.substr(1, i - 1).replace(/\\\'/g, '\''), 'string');
					this.consume(i + 1);
					return tok;
				}
			}
		}
	},

	argVal: function () {
		return this.scan(/^\s*,?\s*(_|([A-Za-z][\.\w]*\w+(\[\d+\])?)) */, 'param', 'arg');
	},

	jsonVal: function () {
		var cap
			, hooks = 1
			, vd35 = 35;
		if (cap = /^(\s*,?\s*)\{/.exec(this.input)) {
			this.consume(cap[1].length);
			for (var i = 1; i < this.input.length; i++) {
				if (this.input[i] === '{' && this.input[i - 1] !== '\\') {
					++hooks;
				}
				else if (this.input[i] === '}' && this.input[i - 1] !== '\\') {
					if (--hooks === 0) {
						var tok = this.tok('param', this.input.substr(0, i + 1), 'json');
						this.consume(i + 1);
						return tok;
					}
				}
			}
		}
	},

	arrayVal: function () {
		var cap
			, hooks = 1;
		if (cap = /^(\s*,?\s*)\[/.exec(this.input)) {
			this.consume(cap[1].length);
			for (var i = 1; i < this.input.length; i++) {
				if (this.input[i] === '[' && this.input[i - 1] !== '\\') {
					++hooks;
				}
				else if (this.input[i] === ']' && this.input[i - 1] !== '\\') {
					if (--hooks === 0) {
						var tok = this.tok('param', this.input.substr(0, i + 1), 'array');
						this.consume(i + 1);
						return tok;
					}
				}
			}
		}
	},

	param: function () {
		var cap;
		if (cap = /^(\()/.exec(this.input)) {
			this.consume(cap[0].length);
			this.params = true;
			return this.tok('params');
		} else if (cap = /^(\) *)/.exec(this.input)) {
			this.consume(cap[0].length);
			this.params = false;
			return this.tok('paramStop');
		} else if (cap = /^ *=> */.exec(this.input)) {
			this.consume(cap[0].length);
			this.params = false;
			return this.tok('callback');
		} else if (this.params) {
			return this.numVal()
				|| this.stringVal()
				|| this.argVal()
				|| this.jsonVal()
				|| this.arrayVal();
		}

	},

	comment: function() {
		var captures;
		if (captures = /^ *\/\/(-)?([^\n]*)/.exec(this.input)) {
			this.consume(captures[0].length);
			return this.tok('comment', captures[2]);
		}
	},


	next: function () {
		return this.param()
			|| this.blank()
			|| this.eos()
			|| this.decl()
			|| this.selector()
			|| this.func()
			|| this.indent()
			|| this.comment()
	},

	read: function () {
		var tok
			, res = [];
		while ((tok = this.advance()) && tok.type !== 'eos') {
			res.push(tok);
		}
		if (tok)
			res.push(tok);
		return res;
	}
};
