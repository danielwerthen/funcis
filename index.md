---
layout: default
title: Func.is by Daniel Werthén
---

Func.is
=======

**Func.is** is a scripting language for writing distributed applications.

Checkout the [Quickstart guide](http://github.com/danielwerthen/funcis) at Github.

Its primary focus is to making the modelling of flows of information between apps in a distributed environment dead simple.  The user exposes a set of functions to the framework, which can then be called in parallel or in sequence by the script execution.

The reasoning behind this approach is that applications of today are quickly becoming complex. A program is no longer a simple function with a set of inputs and a set of outputs, instead it accomplishes a multitude of things over a long duration.  Complexity is of course to be avoided at all cost, which is why I created **Func.is**.

The approach was to consider the *function* as the lowest common denominator.  A function in this sense is something which can be triggered to produce an action followed by a set of reactions.  And by mapping these reactions to other functions a chain reaction is created, or in terms of **Func.is**, a flow of information.  These functions are also carrying data, the action accepts inputs and the reaction produces outputs.

The nice thing about **Func.is** is that it completely disregards the chain of events that takes place inbetween an action and a reaction.  There isn't even a constraint in time for this process.  What we end up with, is a very general piece of abstraction and a suitable building block.

A function might very well do anything, from a simple arithmic operation to a http server.  It can even encompass aspects outside the digital domain.  Say for instance a function which accepts text as its input and then in some non descript magical manner shows this text to an actual human being which grades the text for its creativity and returns a number.  This function, along with with the arithmic one, can then be chained together in a **Func.is** script, given of course that they each have a compatible implementation of the **Func.is** framework.

And this very general approach is useful since it decouples the *how* from the *why* of application architecture.  Which is useful, for instance if either of these aspects were to change independantly of the other.

A nice consequence to all of this, is that it becomes trivial to distribute each step in the chain reaction to a seperate process.

## Communication

The current implementation of **Func.is** supports two forms of communication, HTTP and HTTPS.  To speed things up, a custom streaming protocol is used.  Since the function execution is completely forward facing and state less, each message passing is fire and forget.

The messages are encapsulated in a function context package, made up by four distinct parts.

- Signature - A MD5 hash of the script
- Position - An array of indexes corresponding to the function to be called
- Scope - A JSON object made up by the named arguments which will be used later in the function chain
- Parent - In the case of a continuation, the current context is made into the parent of a new function context, starting at the beginning of the continuation

Each context is capable of continuing the chain of execution at any given time, which opens up for creative error handling scenarios and offline capablilities.

## Future Features

### Conditionals

Through-out the work of implementing and imagining this project I have been considering whether to include conditionals or not.  And it would probably be a very *convenient* feature to be sure.  Let's consider the error handling scenario of a function which might produce an error:

{% highlight coffeescript %}
Node.DoWork(args)
	(err, result) =>
		Node.HandleResult(err, result)
{% endhighlight %}

Now, we would not want the `HandleResult` function to be fired if `DoWork` really did produce an error.  So where would the conditional logic be implemented?  Given the current implementation we would probably place it inside the `HandleResult` function and also include the `err` as argument, aswell as `result`.

The alternative approach would be to use a conditional in the **Func.is** script itself.

{% highlight coffeescript %}
Node.DoWork(args)
	(err, result) =>
		if (err)
			Node.Log(err)
		else
			Node.HandleResult(result)
{% endhighlight %}

The question remains though, whether this branching really is that much different from the following:

{% highlight coffeescript %}
Node.DoWork(args)
	(err, result) =>
		Node.OnErr(err)
			Node.Log(err)
		Node.OnNoErr(err)
			Node.HandleResult(result)
{% endhighlight %}

And that difference may or may not be significant.  I chose to go with the simple approach of considering everything as a function, even branching logic.

### Expressions

What might be more useful than conditionals though, is expressions.  Say for instance that we have to branching functions, `OnTrue` and `OnFalse`.

{% highlight coffeescript %}
Node.Query(args)
	(boolean) =>
		Node.OnTrue(boolean)
			Node.DoThis()
		Node.OnFalse(boolean)
			Node.DoThat()
{% endhighlight %}

It would be very convienient to be able to express some inline operations instead of just the arguments themselves.  Perhaps `Query` produces a number instead of a boolean.

{% highlight coffeescript %}
Node.Query(args)
	(number) =>
		Node.OnTrue(number > 5)
			Node.DoThis()
		Node.OnFalse(number <= 5)
			Node.DoThat()
{% endhighlight %}

Again, I chose not to implement this and stick with the simplest feature set possible.  Everything is a function.

### Cross-platform

Not a feature per say, but it is important to note that **Func.is** was never imagined to be a Javascript and Nodejs project alone.  Thanks to its simplicity it would be relatively easy to implement other versions of **Func.is** on other platforms, and because of the HTTP message passing it would also be easy to make these versions talk to each other. Allowing for distributed applications which would be distributed not only across processes, but platforms too.

It would also be curious to see what kind of performance one could produce in **Func.is** implemented on a *lower* level language like C, or Go.

### Performance

As the implementation stands today it is far from optimized for speed.  Each step in a given function chain introduces significant overhead.  A part of that is of course due to the message passing and serializing, but it is also due to the dynamic nature of the current script interpretation.  Each function call is currently dynamically resolved against the current node setup.  Given a static node setup, each function step could be pre computed in a sense.  The communication pathways could also be made more static in this scenario, allowing for better ways of determining whether the complete system is online or not.

Given a distributed system of a more local nature, one could also implement more bare bone communication, and be rid of the overhead inherit to HTTP.  
