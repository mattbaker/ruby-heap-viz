module ReplUtils
  def example!
    #Demonstrate object creation and referencing by a variable
    @greeting = Example::String.new("Hello")
    #Demonstrate two variables referencing the same object
    @english_greeting = @greeting
    #Demonstrate object references
    @greetings = Example::Array.new
    @greetings << @greeting
    #Demonstrate object references to an "un-named" object
    @greetings << Example::String.new("Hola")
    #Demonstrate an orphaned object
    #Force ruby's garbage collection with GC.start to watch it disappear!
    Example::String.new("Hard knock life")
    nil
  end

  def reset!
    instance_variables.each {|v| remove_instance_variable(v)}
    GC.start
  end
end