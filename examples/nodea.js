var funcis = require('../index')
	, http = require('http')
	, app = funcis();

var nodea = app.node('NodeA');
nodea.functions.add('Add', function (arg1, arg2, cb) {
	cb(arg1 + arg2);
});

http.createServer(app.listen()).listen(5001);

var nodeb = app.connect({ host: 'localhost', port: 5000 });
nodeb.addNode('NodeB');

app.script('addition');
