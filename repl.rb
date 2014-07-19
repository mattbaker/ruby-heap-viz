require 'irb'
require 'pp'
require 'websocket-pipe'
require_relative 'ruby-lib/irb-patch'
require_relative 'ruby-lib/example-classes'
require_relative 'ruby-lib/heap-utils'
require_relative 'ruby-lib/repl-utils'

include HeapUtils
include ReplUtils
POLL_INTERVAL = 0.1

#Fork our broadcaster
ws_pid, ws_writer = WebsocketPipe.fork!

#Periodically push heap state to clients
Thread.new { heap_poll(ws_writer, POLL_INTERVAL) }

trap("EXIT") do
  Process.kill("KILL", ws_pid)
  exit
end

puts "Heap Console Ready."
IRB.start
