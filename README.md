#Heap Viz

An interactive Ruby Heap Visualization

##Usage

Start the heap viz REPL with `ruby heap-console.rb`. This will kick off a separate process for the websocket server, and start a thread locally that will periodically push the state of the heap to all websocket clients.

If you would like to start the console with a couple examples invoke like so: `ruby heap-console.rb example`.

Open `viz/index.html` to see the heap visualization.

Two classes are currently available, `Example::String` and `Example::Array`. They behave just like `String` and `Array`. You need to use instance variables at the REPL if you want them picked up in the variable name table, but local variables will still affect the heap state if that's what you want.

Example:

```
Heap Console Ready.
> @greeting = Example::String.new("Hello")  #New String
=> #<Example::String:0x007fbf7a1d9430 @string="Hello">
> @greetings = Example::Array.new  #New Array
=> #<Example::Array:0x007fbf7a82bb30 @elements=[]>
> @greetings << @greeting  #Example of Array ref
=> [#<Example::String:0x007fbf7a1d9430 @string="Hello">]
> @greetings << Example::String.new("Hola")  #Unnamed var example
=> [#<Example::String:0x007fbf7a1d9430 @string="Hello">,
 #<Example::String:0x007fbf7a1d00d8 @string="Hola">]
> @greetings2 = @greetings.dup #demonstrates shallow copy behavior
=> #<Example::Array:0x007fbf7a1cb768
 @elements=
  [#<Example::String:0x007fbf7a1d9430 @string="Hello">,
   #<Example::String:0x007fbf7a1d00d8 @string="Hola">]>
```

