var funcis = require('../index')
	, http = require('http')
	, app = funcis();

var nodeb = app.node('NodeB');
nodeb.functions.add('Print', function (arg1, cb) {
	console.log(arg1);
	cb();
});

http.createServer(app.listen()).listen(5000);

var nodea = app.connect({ host: 'localhost', port: 5001 });
nodea.addNode('NodeA');

app.script('addition');
