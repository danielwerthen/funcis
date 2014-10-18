if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function (require) {
  exports.combine = function (count, done) {
    var errs = []
      , args = []
      , id = 0;
    return function (err, data) {
      errs.push(err);
      args.push(data);
      if (++id === count) {
        done(errs, args);
      }
    };
  };
});
