require 'json'
require 'objspace'
require_relative 'object-node'
require_relative 'example-classes'

module HeapUtils
  def heap_poll(writer, interval)
    last_msg = nil

    loop do
      msg = ObjectNode.graph(var_table).to_json
      writer.puts(msg) if last_msg != msg
      last_msg = msg
      sleep(interval)
    end
  end

  def var_table
    vars = Hash.new { |h,k| h[k] = [] }
    instance_variables.each do |var_name|
      obj = eval(var_name.to_s)
      vars[obj.object_id] << var_name.to_s
    end
    vars
  end
end