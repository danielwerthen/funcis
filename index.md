---
layout: default
title: Func.is by Daniel Werthén
---

Func.is
=======

**Func.is** is a scripting language for writing distributed applications.

Its primary focus is to making the modelling of flows of information between apps in a distributed environment dead simple.  The user exposes a set of functions to the framework, which can then be called in parallel or in sequence by the script execution.

The reasoning behind this approach is that applications of today are quickly becoming complex. A program is no longer a simple function with a set of inputs and a set of outputs, instead it accomplishes a multitude of things over a long duration.  Complexity is of course to be avoided at all cost, which is why I created **Func.is**.

The approach was to consider the *function* as the lowest common denominator.  A function in this sense is something which can be triggered to produce an action followed by a set of reactions.  And by mapping these reactions to other functions a chain reaction is created, or in terms of **Func.is**, a flow of information.  For these functions are also carriers of data, the action accepts inputs and the reaction produces outputs.

The nice thing about **Func.is** is that it completely disregards the chain of events that takes place inbetween an action and a reaction.  There isn't even a constraint in time for this process.  What we end up with, is a very general piece of abstraction and a suitable building block.

A function might very well be anything, from a simple arithmic operation to a http server.  It can even encompass aspects outside the digital domain.  Say for instance a function which accepts text as its input and then in some non descript magical manner shows this text to an actual human being which grades the text for its creativity and returns a number.  This function, along with with the arithmic one, can then be chained together in a **Func.is** script, given of course that they each have a compatible implementation of the **Func.is** framework.

And this very general approach is useful since it decouples the *how* from the *why* of application architecture.  This is useful if, for instance, either of these aspects were to change independantly of the other.

A nice effect to all of this is that it becomes trivial to distribute each step in the chain reaction to seperate processes, and thus making it easier for user to build distributed applications.
