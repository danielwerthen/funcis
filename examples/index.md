---
layout: examples
title: Func.is by Daniel Werthén
---

## Examples
### The Canary

Since the script execution and loading is done dynamically, it might be a good idea a canary to find out whether the distributed system is properly online.

The canary is a signal with a starter node that sequentially visit any path that might be used by other scripts, and then returns back to the starter node.  This might be done once or with a given interval depending on the need of the system.  It might also be useful to include timestamp to the signal so that it is possible to measure the round trip time, somewhat accurately.

Say for instance that we have a couple of nodes with the names: `Control`, `NodeA`, `NodeB`, `NodeC`.  The canary might then be implemented scriptwise such as:

{% highlight coffeescript %}
Control.CanaryStart()
	(time) =>
		NodeA.Passalong()
			NodeB.Passalong()
				NodeC.Passalong()
					Control.CanaryEnd(time, 'Path ABC')
		NodeC.Passalong()
			NodeB.Passalong()
				NodeA.Passalong()
					Control.CanaryEnd(time, 'Path CBA')
{% endhighlight %}

In this case the `CanaryEnd` method also takes a string representing which path that is measured.  This examples also only covers the pathes ABC and CBA, and not BAC for instance.  If the other combinations of traversal is also used, those too should be tested.

This might be the implementation of `Control`:
{% highlight javascript %}
var EventEmitter = require('events').EventEmitter
	, reporter = new EventEmitter();

control.functions.add('CanaryStart', function (next) {
	var interval = setInterval(function () {
		next(Date.now());
	}, 1000);
	this.onStop(function () {
		clearInterval(interval);
	});
});

control.functions.add('CanaryEnd', function (time, path) {
	reporter.emit(path, Date.now() - time);
});
{% endhighlight %}

It is noteworthy that it would be a could idea to clean up the `interval` set by the `CanaryStart` functions, since it would keep going even though the script might be shut down.  This is done through the context `this` and the event `onStop`, which fires once the script stops.

This might be the implementation of `NodeA-C`:

{% highlight javascript %}
node.functions.add('Passalong', function (next) {
	next();
});
{% endhighlight %}

### Osc

Or any other message passing protocol.

Say for instance we have a setup with alot of different multimedia devices that we would like to use as one, and they all talk OSC.  So the baseline functionality is that each node in the network has at least two functions: `SendOSC(address, value)` and `ReceiveOSC(address) => (time, value)`.

The basic scenario would be that we listen to OSC from one node and transfer a corresponsing signal in another.

{% highlight coffeescript %}
Sound.ReceiveOSC('/beat')
	(time, value) =>
		Lights.SendOSC('/strobe', value)
{% endhighlight %}

Perhaps there are several *light* nodes;

{% highlight coffeescript %}
Sound.ReceiveOSC('/beat')
	(time, value) =>
		LightsRoof1.SendOSC('/strobe', value)
		LightsRoof2.SendOSC('/strobe', value)
		WallFixtures.SendOSC('/flash', value)
{% endhighlight %}

Perhaps the *wall fixtures* should be delayed by `250ms` before flashing.

{% highlight coffeescript %}
Sound.ReceiveOSC('/beat')
	(time, value) =>
		LightsRoof1.SendOSC('/strobe', value)
		LightsRoof2.SendOSC('/strobe', value)
		WallFixtures.Delay(250)
			WallFixtures.SendOSC('/flash', value)
{% endhighlight %}

And so on, for something a little more advanced, perhaps we are interested in `/beat` per minute rather than `/beat` itself.

{% highlight coffeescript %}
Sound.ReceiveOSC('/beat')
	(time, value) =>
		Sound.PerMinute(time, value)
			(bpm) =>
				Control.SendOSC('/dashboard/bpm', bpm)
{% endhighlight %}

It is scriptwise rather straightforward, but the function `PerMinute` is a little bit different.  It will be entered potentially multiple times per minutes but only exit once per minute.

{% highlight javascript %}
var ticks = 0
	, continue;

setInterval(function () {
	if (continue)
		continue(ticks);
	ticks = 0;
}, 1000 * 60);

sound.functions.add('PerMinute', function (time, value, next) {
	ticks++;
	continue = next;
});
{% endhighlight %}

Do note that this function only carries one state, so it can only properly be used in one signal at a time.  Imagine for instance the following:

{% highlight coffeescript %}
Sound.ReceiveOSC('/beat1')
	(time, value) =>
		Sound.PerMinute(time, value)
			(bpm) =>
				Control.SendOSC('/dashboard/bpm1', bpm)

Sound.ReceiveOSC('/beat2')
	(time, value) =>
		Sound.PerMinute(time, value)
			(bpm) =>
				Control.SendOSC('/dashboard/bpm2', bpm)
{% endhighlight %}

And let's say that `/beat1` fires 60 times per minute and `/beat2` fires 120 times per minute.  First of, `continue` would be set to the last signal callback.  Which would probably be `/beat2` since it fires much faster.  So `/dashboard/bpm1` might never be set.  But the returned `bpm` value from `PerMinute` would also be wrong.  It would likely be around 60 + 120.  One way to fix this would be to add an identifier to each signal.

{% highlight coffeescript %}
Sound.ReceiveOSC('/beat1')
	(time, value) =>
		Sound.PerMinute('/beat1', time, value)
			(bpm) =>
				Control.SendOSC('/dashboard/bpm1', bpm)

Sound.ReceiveOSC('/beat2')
	(time, value) =>
		Sound.PerMinute('/beat2', time, value)
			(bpm) =>
				Control.SendOSC('/dashboard/bpm2', bpm)
{% endhighlight %}

And modify the `PerMinute` function accordingly:

{% highlight javascript %}
var states = {};

setInterval(function () {
	for (var id in states) {
		if (states[id].continue)
			states[id].continue(states[id].ticks);
		states[id].ticks = 0;
	}
}, 1000 * 60);

sound.functions.add('PerMinute', function (id, time, value, next) {
	if (!states[id]) {
		states[id] = { ticks: 0, continue: next };
	}
	states[id].ticks++;
});
{% endhighlight %}

### Cross Protocol

As we saw in the example above, it is fairly straight forward to build signals between nodes which in turn communicates something outside of **Func.is**.  But it is perhaps more interesting to note that it is as easy to facilitate communication between different protocols.  To continue with the example above, lets extend it so that the light fixtures are controlled by DMX.

{% highlight coffeescript %}
Sound.ReceiveOSC('/beat')
	(time, value) =>
		LightsRoof1.SendDMX(15, value)
		LightsRoof2.SendDMX(12, value)
		WallFixtures.SendDMX(124, value)
{% endhighlight %}
