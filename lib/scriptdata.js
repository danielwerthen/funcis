if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function (require) {
  var _ = require('lodash')
    , signature = require('./signature')
    , util = require('util')

  var Script = exports.Script = function (constants, continuations, functions) {
    this.constants = constants;
    this.continuations = continuations;
    this.conts = _.values(continuations);
    this.functions = functions;
    this.signature = signature.create(this.print());
    var trav = _.bind(this._traverse, this);
    this.traverse = _.memoize(trav, function (pos) { return pos.join(''); });
  };

  var Func = exports.Func = function (selector, name, input, output) {
    this.selector = selector;
    this.name = name;
    this.input = input || [];
    this.output = output || [];
    this.passalongs = [];
    this.callbacks = [];
  };

  var Expr = exports.Expr = function (val, type) {
    this.val = val;
    this.type = type;
  };

  Script.prototype = {
    print: function (opt) {
      opt = opt || {};
      opt.indent = opt.indent || '\t';
      var res = [];
      for (var i in this.constants) {
        res.push(printConst(i, this.constants[i], opt));
      }
      res.push('');
      for (var i in this.continuations) {
        res.push.apply(res, printCont(this.continuations[i], opt));
      }
      res.push('');
      for (var i in this.functions) {
        res.push.apply(res, printFunc(this.functions[i], 0, opt));
      }
      return res.join('\n');
    },
    _traverse: function (pos) {
      if (!pos.length) return null;
      var fst = pos[0];
      //Is a continuation
      if (fst >= this.functions.length) {
        var id = fst - this.functions.length;
        if (id >= this.conts.length) return null;
        return traverse(this.conts[id], pos, 1);
      }
      //Is a function
      return traverse(this.functions[fst], pos, 1);
    },
    getContId: function (name) {
      for (var i in this.conts) {
        if (this.conts[i].name === name) return Number(i) + this.functions.length;
      }
    }
  };

  function traverse(fn, pos, pid) {
    if (pid >= pos.length) return fn;
    var id = pos[pid];
    if (fn.callbacks.length <= id) return null;
    return traverse(fn.callbacks[id], pos, pid + 1);
  }

  function printConst(name, cn, opt) {
    return util.format('let %s = %s', name, cn.val);
  }

  function printCont(cont, opt) {
    var res = [ util.format('let %s = %s =>', cont.name, printParams(cont.output))
      , _.map(cont.callbacks, function (e) { return printFunc(e, 1, opt); }) ];
    return _.flatten(res);
  }

  function printFunc(f, indent, opt) {
    indent = indent || 0;
    var indents = (new Array(indent + 1)).join(opt.indent);
    var res = [ util.format('%s%s %s', 
        f.selector ? f.selector + '.' : '', 
        f.name, 
        printParams(f.input)) ];
    
    var nextIndent = 1;

    if (f.output.length > 0) {
      res.push(opt.indent + printParams(f.output) + ' =>');
      nextIndent++;
    }

    if (f.callbacks.length > 0)
      res.push(_.map(f.callbacks, function (e) { return printFunc(e, nextIndent, opt); }));
    return _(res)
      .flatten()
      .map(function (e) { return indents + e; })
      .value();
  }

  function printParams(params) {
    return util.format('(%s)', _.map(params, function (e) { return e.val; }).join(', '));
  }
});
