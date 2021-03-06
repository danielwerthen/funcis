Func.is
======

In short, **Func.is** is about simplicity.  It's main ambition is to make app to app communication dead simple.

The idea is, to expose a certain set of functions in each distinct app, or *node*, and allow scripts to define flows of information between these functions.  What the framework does, in essence, is to execute and pass along the results of these functions.

Checkout the userguide at [Func.is](http://func.is).

Installation
============

Given that you have a nice enough version of Node and Npm
Install via npm:

	$ npm install funcis

Usage
=====

A *app.js* file:

```js
var funcis = require('funcis')
	, app = funcis();

var node = app.node('Node');
node.functions.add('Add', function (arg1, arg2, next) {
	next(arg1 + arg2);
});
node.functions.add('Print', function (val, next) {
	console.log(val);
});

app.script('addition');
```

A *addition.is* file: ('.is' is the default extension to script files)

	Node.Add(5, 5)
		(res) =>
			Node.Print(res)

Let's extend this with a second *node* in another app.
*NodeA.js*:

```js
var funcis = require('funcis')
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


```

*NodeB.js*:

```js
var funcis = require('funcis')
	, http = require('http')
	, app = funcis();

var nodeb = app.node('NodeB');
nodeb.functions.add('Print', function (val, cb) {
	console.log(val);
});

http.createServer(app.listen()).listen(5000);

var nodea = app.connect({ host: 'localhost', port: 5001 });
nodea.addNode('NodeA');

app.script('addition');
```

We also need to update *addition.is*:

```
NodeA.Add(5,5)
	(res)
		NodeB.Print(res)
```

Scripting
=========

The current script syntax is heavily influenced by Javascript with a little bit of lambda dashed onto it.

```coffeescript
Node.FunctionA(arg1, arg2)
	(err, res) =>
		Node.FunctionB(err, res)
```

If a function returns nothing the second argument definition may be omitted.

```coffeescript
Node.FunctionA(arg1)
	Node.FunctionB(arg2)
```

Except for passing argument references like `arg1` one can also pass constant json objects, array, strings and number.

```coffeescript
Node.FunctionA("Number", 35, "Array", [ 12, 24, 35 ], "And objects", { key: "value" })
```

We can also define constants and give them a name, which allows for easy reuse.

```coffeescript
let pi = 3.14159265358979323846264338327950

Node.Calc(5, pi)
	(res) =>
		Node.Equal(res, pi)
```

It is also possible to declare function chains this way, or *continuations*.

```coffeescript
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
```

This is practically the same thing as if the `Join` *continuation* would have been written in place, however repeated.

The part in front of the function name is called the *selector* and is used to resolve the affected nodes.  In the examples above it is simply a *node* name.  The *node* name is supposedly unique, but there can also be one or more *class* names inherit to a *node*.  This kind of *selector* is signified with a `.`.

```coffeescript
.Class.Func1()
```
		
Several *class* names may be combined to specify the *node* query.  
	
```coffeescript
.ClassA.ClassB.Func()
```

The `!` character signifies that a specific *class* name should be omitted.

```coffeescript
.IncludeClassA!ExcludeClassB.Func()
```

If the selector resolves into several *nodes* the function call will be executed in each and every one of these *nodes* concurrently.

License
=======

The MIT License (MIT)
Copyright (c) 2012-2013 Daniel Werthén <danielwerthen@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
