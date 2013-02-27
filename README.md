Funcis
======

In short, **Func.is** is about simplicity.  It's main ambition is to make app to app communication dead simple.

The idea is, to expose a certain set of functions in each distinct app, or *node*.  Scripts can then be created which defines chains of function calls.  These chains can then be executed across this distributed domain of *nodes*.


Scripting
=========

The current script syntax is heavily influenced by Javascript with a little bit of lambda dashed onto it.

	Node.Function(arg1, arg2)
		(err, res) =>
			Node.Function(err, res)

Easy isn't it?
