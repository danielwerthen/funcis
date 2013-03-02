---
layout: api
title: Func.is by Daniel Werthén
---

API
===


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
node.functions
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
- `port`		Port of remote server. Defaults to 80 or 443 (https).
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
