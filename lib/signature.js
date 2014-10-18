if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function (require) {
  var crypto = require('crypto');

  exports.create = function (str, encoding, digest) {
    encoding = encoding || 'utf8';
    digest = digest || 'hex';
    var hash = crypto.createHash('md5');
    hash.update(str, encoding);
    return hash.digest(digest);
  };
});
