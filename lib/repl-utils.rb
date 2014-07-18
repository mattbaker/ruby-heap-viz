module ReplUtils
  def example!
    @greeting = Example::String.new("Hello")
    @english_greeting = @greeting
    @greetings = Example::Array.new
    @greetings << @greeting
    @greetings << Example::String.new("Hola")
    nil
  end

  def reset!
    instance_variables.each {|v| remove_instance_variable(v)}
    GC.start
  end
end