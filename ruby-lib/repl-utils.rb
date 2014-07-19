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

  def viz!
    open_is_present = system('command -v open >/dev/null 2>&1')
    if open_is_present
      system('open viz.html')
    else
      puts "The `open` executable cannot be found in your PATH"
    end
  end
end