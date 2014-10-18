var requirejs = require('requirejs'),
    fs = require('fs'),
    config = {
  baseUrl: './lib',
  name: 'funcis',
  out: './bin/funcis.js',
  nodeRequire: require,
  optimize: "none"
};

requirejs.optimize(config, function (buildResponse) {
  var contents = fs.readFileSync(config.out, 'utf8');
  console.log(contents);
  console.log(buildResponse);
}, function (err) {
  console.dir(err);
});
