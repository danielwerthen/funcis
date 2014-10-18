if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function (require) {
  var _ = require('lodash')
    , EventEmitter = require('events').EventEmitter
    , directory = require('./directory')
    , Node = require('./node')
    , Interp = require('./interp')
    , Parser = require('./parser')
    , u2 = require('./utilities')
    , listener = require('./listener')
    , Remote = require('./remote')
    , log = u2.log
    , defaultOptions = { verbose: true, loglevel: 1 };

  var Engine = module.exports = function (options) {
    var self = this;
    this.opt = _.extend({}, defaultOptions, options);
    this.scripts = directory.create();
    this.nodes = directory.create();
    this.runners = {};
    this.remotes = directory.create();

    this.scripts.on('added', _.bind(this._initScript, this));
    this.scripts.on('removed', _.bind(this._deinitScript, this));

    this.__log = log(this.opt.verbose, this.opt.loglevel);
    this._requests = new EventEmitter();

    this._requests.on('call', function (data) {
      self.handleData(data);
    });

  };

  Engine.prototype = {
    _log: function () {
      this.__log.apply(this, arguments);
    },
    createNode: function (name, classes) {
      var node;
      this.nodes.add(name, node = new Node(name, classes, this));
      return node;
    },
    listen: function (options) {
      return listener(_.extend(this.opt, options), this._requests);
    },
    connect: function (connection) {
      var remote = new Remote(connection);
      this.remotes.add(remote.name, remote);
      return remote;
    },
    resolve: function (selector, locals) {
      var local = this.nodes.filter(function (name, node) {
        return node.match(selector);
      });
      if (locals)
        return local;
      return _.union(local, this.remotes.filter(function (name, remote) {
        return remote.match(selector);
      }));
    },
    context: function (state) {
      var runs = _.filter(_.values(this.runners), function (run) {
        return run.script.signature === state.signature;
      });
      return runs.length ? runs[0].context : null;
    },
    handleExit: function (state, args) {
      var runs = _.filter(_.values(this.runners), function (run) {
        return run.script.signature === state.signature;
      })
        , self = this;
      _.each(runs, function (run) {
        run.exit(state, args, function (err) {
          if (err) return self._log(1, err);
        });
      });
    },
    handleData: function (data) {
      var state = _.pick(data, 'signature', 'pos', 'stack')
        , self = this;

      if (state.signature && _.isString(state.signature)) {
        var runs = _.filter(_.values(this.runners), function (run) {
          return run.script.signature === state.signature;
        });
        _.each(runs, function (run) {
          run.enter(state, true, function (err) {
            if (err) return self._log(1, err);
          });
        });
      }
      else {
        this._log(2, 'Bad data received');
      }
    },
    _initScript: function (name, data) {
      var self = this
        , script = data;
      if (_.isString(data)) {
        script = new Parser(data).parse();
      }
      if (this.runners[name]) this.runners[name].stop();
      this.runners[name] = new Interp(script, this);
      this._log(5, 'Initializing script: ' + name);
      this.runners[name].start(function (err) {
        if (err) return self._log(1, err);
        self._log(5, 'Script is running: ' + name);
      });
    },
    _deinitScript: function (name) {
      if (this.runners[name]) {
        this.runners[name].stop();
        this.runners[name] = undefined;
        this._log(5, 'Deinitialized script: ' + name);
      }
      else 
        this._log('Script not found: ' + name + '. Presumably a mistake has occured.');
    }
  };
  return Engine;
});

