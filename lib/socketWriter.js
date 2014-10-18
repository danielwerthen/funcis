if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function (require) {
  var _ = require('lodash')
    , reader = require('./socketReader');

  module.exports = function (socket, options) {
    options = options || {};
    var replacer = options.replacer || reader.defaults.replacer
      , delimiter = options.delimiter || reader.defaults.delimiter
      , basePath = options.basePath || reader.defaults.basePath
      , encoding = options.encoding || reader.defaults.encoding
      , logger = options.logger || reader.defaults.logger
      , working = true
      , pending = {} 
      , ids = 0

    function stop() {
      working = false;
      for (var id in pending) {
        pending[id](false);
      }
      pending = {};
      ids = 0;
    }

    socket.on('error', function (e) {
      logger(3, e);
      stop();
    });
    socket.on('end', function () {
      stop();
    });
    socket.on('close', function () {
      stop();
    });
    
    return {
      write: function (data, callback) {
        var _cb = _.once(callback)
          , id = ids++;
        try {
          var str = _.isString(data) ? data : JSON.stringify(data);
          str = str.replace(new RegExp(delimiter, "g"), replacer);
          socket.write(str + delimiter, function () {
            delete pending[id];
            _cb(true);
          });
          pending[id] = _cb;
        } catch (e) {
          logger(1, e);
          _cb(false);
        }
      }, 
      canWrite: function () {
        return working;
      }
    };
  };
});
