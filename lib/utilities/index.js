if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function (require) {
  exports.regs = require('./regs');
  exports.matcher = require('./matcher');
  exports.log = require('./log');
  exports.async = require('./async');
  exports.files = require('./files');
});
