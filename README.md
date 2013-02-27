Funcis
======

In short, **Func.is** is about simplicity.  It's main ambition is to make app to app communication dead simple.

The idea is, to expose a certain set of functions in each distinct app, or *node*, and allow scripts to define flows of information between these functions.  What the framework does, in essence, is to execute and pass along the results of these functions.


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

Scripting
=========

The current script syntax is heavily influenced by Javascript with a little bit of lambda dashed onto it.

	Node.Function(arg1, arg2)
		(err, res) =>
			Node.Function(err, res)

If a function returns nothing the second argument definition may be omitted.

	Node.Function(arg1)
		Node.Function(arg2)

Except for passing argument references like `arg1` one can also pass constant json objects, array, strings and number.

	Node.Function("Number", 35, "Array", [ 12, 24, 35 ], "And objects", { key: "value" })

We can also define constants and give them a name, which allows for easy reuse.

	let pi = 3.14159265358979323846264338327950

	Node.Calc(5, pi)
		(res) =>
			Node.Equal(res, pi)

It is also possible to declare function chains this way, or *continuations*.

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

This is practically the same thing as if the `Join` *continuation* would have been written in place, however repeated.

The part in front of the function name is called the *selector* and is used to resolve the affected nodes.  In the examples above it is simply a *node* name.  The *node* name is supposedly unique, but there can also be one or more *class* names inherit to a *node*.  This kind of *selector* is signified with a `.`.

	.Class.Func1()
		
Several *class* names may be combined to specify the *node* query.  
	
	.ClassA.ClassB.Func()

The `!` character signifies that a specific *class* name should be omitted.

	.IncludeClassA!ExcludeClassB.Func()

If the selector resolves into several *nodes* the function call will be executed in each and every one of these *nodes* concurrently.
