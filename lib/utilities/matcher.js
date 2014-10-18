if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function (require) {
  var _ = require('lodash')
    , regs = require('./regs');

  exports.node = function (name, classes, selector) {
    var sel = regs.selector(selector)
    if (sel.name && sel.name !== name) {
      return false;
    }
    return _.every(sel.classes, function (cl) {
      if (_.some(classes, function (e) {
        return e === cl.name;
      })) {
        if (cl.exclude) {
          return false;
        }
      }
      else if (cl.include) {
        return false;
      }
      return true;
    });
  };
});
