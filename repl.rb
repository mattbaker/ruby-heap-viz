require 'pp'
require_relative 'lib/websocket-pipe'
require_relative 'lib/example-classes'
require_relative 'lib/heap-utils'
require_relative 'lib/repl-utils'

include HeapUtils
include ReplUtils
POLL_INTERVAL = 0.1

#Fork our broadcaster
ws_pid, ws_writer = WebSocketPipe.fork!

#Periodically push heap state to clients
Thread.new { heap_poll(ws_writer, POLL_INTERVAL) }

trap("EXIT") do
  Process.kill("KILL", ws_pid)
  exit
end

require 'irb'
require_relative 'lib/irb-patch'

puts "Heap Console Ready."
IRB.start

