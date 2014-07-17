require 'io/wait'
require 'em-websocket'
require 'json'

class WebSocketPipe
  POLL_INTERVAL = 0.1

  def initialize(reader)
    @clients = []
    @reader = reader
  end

  def start!
    last_msg = nil
    EM.run do
      EM::WebSocket.run(:host => "0.0.0.0", :port => 8080) do |ws|
        ws.onopen do
          @clients << ws
          ws.send(last_msg)
        end

        ws.onclose do
          @clients.delete(ws)
        end
      end

      EM::PeriodicTimer.new(POLL_INTERVAL) do
        if @reader.ready?
          msg = @reader.gets
          @clients.each {|client| client.send(msg)}
          last_msg = msg
        end
      end
    end
  end
end