---
layout: api
title: Func.is by Daniel Werthén
---

## API

### Node

A node is created from an instance of funcis.

{% highlight javascript %}
var funcis = require('funcis')
	, app = funcis();

var node = app.name('Name', [ 'Classes' ]);
{% endhighlight %}

#### node.functions

Each node has a [directory](#directory) of functions.

{% highlight javascript %}
node.functions.add('Func1', function (arg1, arg2, cb) {
	cb(arg1 + arg2);
}):
{% endhighlight %}

The `key` in the `functions` directory is what is used when scripts resolves function names.

### Directory

#### dir.add(key, item)

The `add` method adds a item to the directory. It throws an error if that `key` is already present.

{% highlight javascript %}
directory.add('key', item);
{% endhighlight %}

#### dir.remove(key)

The `remove` method removes an item specified by `key`.

{% highlight javascript %}
directory.remove('key');
{% endhighlight %}

#### dir.filter(iterator, [context])

The `filter` method returns a subset of the directory that matches the `iterator`.

{% highlight javascript %}
directory.filter(function (key, item) {
	return true;
}, context);
{% endhighlight %}

#### dir.get(key)

The `get` method returns a item specific to `key`.
{% highlight javascript %}
directory.get('key');
{% endhighlight %}

The directory is an `EventEmitter` and emits two events.

#### dir.on('added', function (key, item))

Triggered whenever an item is added to the directory.

#### dir.on('removed', function (key))

Triggered whenever an item is removed from the directory.

### Functions

The functions that is used by **Func.is** has a couple of peculiarities to them.

{% highlight javascript %}
node.functions.add('Func1', function (arg1, arg2, cb) {
	cb(arg1 + arg2);
});
{% endhighlight %}

The arguments is dynamic and resolved in runtime, and they are defined in the script.  Say for instance the function call `NodeA.Func1(5,15)`.  In this case, `arg1` would be equal to `5` and `arg2` would be equal to `15`. The final argument `cb` is the callback to end the function call, and it always gets appended to the argument array.  Now, there could just as well be another function call in another script like `NodeA.Func1(5, 15, 24)`.  Due to the extra addition of `24` in the argument list, `cb` would get this value instead of the callback.  

If the number of arguments really is supposed to differ, and it isn't just and error, this method of finding the callback might be preferable:

{% highlight javascript %}
node.functions.add('Func1', function () {
	var args = Array.prototype.slice.call(arguments)
		, cb = args.pop();
	cb(); 
});
{% endhighlight %}

### State(less)

Since these functions will be executed from multiple scripts and even multiple places in these scripts, the idea of context and state is important.  If ever function would be essentially *pure* and stateless, it would not be much of a problem.  But there might very well be situations when that is neither possible nor preferable.

There are a few way to deal with state, first among them is script-wide state, which this implementation currently supports.  The context attached to each function call contains methods to `get` and `set` this script-wide state.

{% highlight javascript %}
node.functions.add('Func1', function (cb) {
	this.set('key', 3.14);
	this.get('key');
});
{% endhighlight %}

However, this state is *not* synced across applications.  So use it with care.

Another way, which is far more flexible, is to implement it outside of **Func.is**.

{% highlight javascript %}
function get(key) {
	//Return value from memory or database etc
}

function set(key, val) {
	//Set value in memory or database etc
}
node.functions.add('Func1', function (cb) {
	set('key', 3.14);
	get('key');
});
{% endhighlight %}

Extending this state to support multiple contexts in the same function is possible if the *state key* is provided as an argument and thus treated as data in the script execution.  Imagine for instance this script chain:

	NodeA.GetUniqueKey()
		(key) =>
			NodeA.GetData(key)
				(data) =>
					NodeA.ServeData(key)

Now the `GetData` functions might be express such as:

{% highlight javascript %}
node.functions.add('Func1', function (key, cb) {
	cb(get('key'));
});
{% endhighlight %}

### Connect

#### app.connect(connection)
The `connect` method is used to connect an application with another, remotely.  It returns a remote node instance.

{% highlight javascript %}
app.connect({ host: 'localhost', port: 5000 });
{% endhighlight %}

The following options is available in the `connection`.
For more info check out the nodejs documentation, [http](http://nodejs.org/api/http.html#http_http_request_options_callback) and [https](http://nodejs.org/api/https.html#https_https_request_options_callback).

- `protocol` The protocol of the connection, can be either `'http'` or `'https'`. Defaults to `'http'`.
- `host` 		A domain name or IP address of the server to issue the request to. Defaults to `'localhost'`.
- `port`		Port of remote server. Defaults to 80 or 443 (if `protocol = https`).
- `basepath` The basepath of the connection url, host:port/*basepath*/call. Defaults to `'/funcis'`.
- `retries` The number of connection attempts that will be made for each *function call*. Defaults to 5.
- `retryDelay` The delay between each connection attempts in ms. Defaults to 250.
-	`headers` An object containing request headers
- `auth` 		Basic authentication i.e. `'user:password'` to compute an Authorization header.
- `agent` 	Controls Agent behavior. When an Agent is used request will default to Connection: `keep-alive`. 

The following options can be used to create a secure connection over https, given that the protocol is `'https'`.

- `pfx`			Certificate, Private key and CA certificates to use for SSL. Default null.
- `key` 		Private key to use for SSL. Default null.
- `passphrase` A string of passphrase for the private key or pfx. Default null.
- `cert` 		Public x509 certificate to use. Default null.
- `ca` 			An authority certificate or array of authority certificates to check the remote host against.
- `ciphers` A string describing the ciphers to use or exclude. Consult [openssl.org](http://www.openssl.org/docs/apps/ciphers.html#CIPHER_LIST_FORMAT) for details on the format.
- `rejectUnauthorized` If true, the server certificate is verified against the list of supplied CAs. Verification happens at the connection level, before the HTTP request is sent. Default false.

#### remote.addNode(name, classes)

The returned remote node instance is used to define which nodes will be expected to be present in the remote app.

{% highlight javascript %}
var remote = app.connect({ host: 'localhost', port: 5000 });
remote.addNode('RemoteNode', [ 'Class1', 'Class2' ]);
{% endhighlight %}

### Listen

#### app.listen([options])

The **Func.is** server is activated by the method `listen`, but it does not create a http, or https, server on its own.

{% highlight javascript %}
var http = require('http')
	, funcis = require('funcis')();

var server = http.createServer(funcis.listen());
server.listen(5001);
{% endhighlight %}

Or in the case of https:

{% highlight javascript %}
var https = require('https')
	, funcis = require('funcis')()
	, key = 'The private key'
	, ca = 'The authority certificate'
	, cert = 'Public x509 certificate';

var server = http.createServer({
	key: 'The private key'
	, ca = 'The autority certificate'
	, cert = 'Public x509 certificate'
	, requestCert = true
	, rejectUnauthorized: true
}, funcis.listen()));

server.listen(5001);
{% endhighlight %}

The listener can also be used as a middleware by [express](http://expressjs.com/):

{% highlight javascript %}
var http = require('http')
	, express = require('express')
	, funcis = require('funcis')()
	, app = express();

app.configure(function () {
	app.set('port', process.env.PORT || 5002);
	app.use(express.logger('dev'));
	app.use(funcis.listen());
	app.use(express.bodyParser());
});

var server = http.createServer(app);
server.listen(app.get('port'));
{% endhighlight %}

### Scripts

The current script syntax is heavily influenced by Javascript with a little bit of lambda dashed onto it.

{% highlight coffeescript %}
Node.FunctionA(arg1, arg2)
	(err, res) =>
		Node.FunctionB(err, res)
{% endhighlight %}

If a function returns nothing the second argument definition may be omitted.

{% highlight coffeescript %}
Node.FunctionA(arg1)
	Node.FunctionB(arg2)
{% endhighlight %}

Except for passing argument references like `arg1` one can also pass constant json objects, array, strings and number.

{% highlight coffeescript %}
Node.FunctionC("Number", 35, "Array", [ 12, 24, 35 ], "And objects", { key: "value" })
{% endhighlight %}

We can also define constants and give them a name, which allows for easy reuse.

{% highlight coffeescript %}
let pi = 3.14159265358979323846264338327950

Node.Calc(5, pi)
	(res) =>
		Node.Equal(res, pi)
{% endhighlight %}

It is also possible to declare function chains this way, or *continuations*.

{% highlight coffeescript %}
let Join = (err, res)
	Node.Match(err, res)
		(OK) =>
			Node.Report(OK, res)

Node.Request()
	(data) =>
		Node.Split(data)
			(err, item) =>
				Join(err, item)
		Node.Split(data)
			(err, item) =>
				Join(err, item)
{% endhighlight %}

This is practically the same thing as if the `Join` *continuation* would have been written in place, however repeated.

The part in front of the function name is called the *selector* and is used to resolve the affected nodes.  In the examples above it is simply a *node* name.  The *node* name is supposedly unique, but there can also be one or more *class* names inherit to a *node*.  This kind of *selector* is signified with a `.`.

{% highlight coffeescript %}
.Class.Func1()
{% endhighlight %}
		
Several *class* names may be combined to specify the *node* query.  
	
{% highlight coffeescript %}
.ClassA.ClassB.Func()
{% endhighlight %}

The `!` character signifies that a specific *class* name should be omitted.

{% highlight coffeescript %}
.IncludeClassA!ExcludeClassB.Func()
{% endhighlight %}

If the selector resolves into several *nodes* the function call will be executed in each and every one of these *nodes* concurrently.
