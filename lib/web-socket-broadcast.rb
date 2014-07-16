require 'em-websocket'

class WebSocketBroadcast

  def initialize
    @clients = []
    @new_client = false
  end

  def start!
    EM.run do
      EM::WebSocket.run(:host => "0.0.0.0", :port => 8080) do |ws|
        ws.onopen { @clients << ws; @new_client = true }
      end
    end
    self
  end

  def broadcast!(msg)
    @new_client = false
    @clients.each {|client| client.send(msg)}
  end

  def new_client?
    @new_client
  end
end