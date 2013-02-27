Funcis
======

In short, **Func.is** is about simplicity.  It's main ambition is to make app to app communication dead simple.

The idea is, to expose a certain set of functions in each distinct app, or *node*, and allow scripts to define flows of information between these functions.  What the framework does, in essence, is to execute and pass along the results of these functions.


Installation
============

Via npm:

	$ npm install funcis


Scripting
=========

The current script syntax is heavily influenced by Javascript with a little bit of lambda dashed onto it.

	Node.Function(arg1, arg2)
		(err, res) =>
			Node.Function(err, res)

Except for passing argument references like `arg1` one can also pass constant json objects, array, strings and number.

	Node.Function("Number", 35, "Array", [ 12, 24, 35 ], "And objects", { key: "value" })


