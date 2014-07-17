require 'pry'
require 'json'
require_relative 'lib/websocket-pipe'
require_relative 'lib/heap-example-tools'
require_relative 'lib/example-classes'

INTERVAL = 0.1

#Assemble map of oid to list of var names
#Local because we need to eval
def var_table
  table = Hash.new { |h,k| h[k] = [] }
  instance_variables.each do |var_name|
    oid = eval(var_name.to_s).object_id
    table[oid] << var_name.to_s
  end
  table
end

#Boot our broadcaster
ws_reader, ws_writer = IO.pipe
ws_pid = fork do
  ws_writer.close
  WebSocketPipe.new(ws_reader).start!
end
ws_reader.close

#Periodically push heap state to clients
Thread.new do
  last_msg = nil

  loop do
    msg = HeapExampleTools.heap_state(var_table).to_json
    need_update = last_msg != msg
    ws_writer.puts(msg) if need_update
    last_msg = msg
    sleep(INTERVAL)
  end
end

#Start REPL session
puts "Heap Console Ready."

if ARGV[0] == "example"
  @greeting = Example::String.new("Hello")
  @english_greeting = @greeting
  @greetings = Example::Array.new
  @greetings << @greeting
  @greetings << Example::String.new("Hola")
end

trap("EXIT") do
  Process.kill("KILL", ws_pid)
  exit
end

Pry.start
