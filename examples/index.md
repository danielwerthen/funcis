---
layout: examples
title: Func.is by Daniel Werthén
---

## Examples
### The Canary

Since the script execution and loading is done dynamically, it might be a good idea a canary to find out whether the distributed system is properly online.

The canary is a signal with a starter node that sequentially visit any path that might be used by other scripts, and then returns back to the starter node.  This might be done once or with a given interval depending on the need of the system.  To allow the starter node to match the returned signal an unique id must be generated for each signal instance.  It might also be useful to include timestamp to the signal so that it is possible to measure the round trip time, somewhat accurately.

Say for instance that we have a couple of nodes with the names: `Control`, `NodeA`, `NodeB`, `NodeC`.  The canary might then be implemented scriptwise such as:

{% highlight %}
Control.CanaryStart()
	(id, time) =>
		NodeA.Passalong()
			NodeB.Passalong()
				NodeC.Passalong()
					Control.CanaryEnd(id, time, 'Path ABC')
		NodeC.Passalong()
			NodeB.Passalong()
				NodeA.Passalong()
					Control.CanaryEnd(id, time, 'Path CBA')
{% endhighlight %}

In this case the `CanaryEnd` method also takes a string representing which path that is measured.  This examples also only covers the pathes ABC and CBA, and not BAC for instance.  If the other combinations of traversal is also used, those too should be tested.

### Parallel
