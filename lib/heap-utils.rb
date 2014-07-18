require 'ruby-mass'
require 'json'
require_relative 'example-classes'

module HeapUtils
  NAMESPACE = Example

  def heap_poll(writer, interval)
    last_msg = nil

    loop do
      msg = heap_state.to_json
      writer.puts(msg) if last_msg != msg
      last_msg = msg
      sleep(interval)
    end
  end

  def heap_state
    var_table = assemble_var_table
    Mass.index(HeapUtils::NAMESPACE)
      .values
      .flatten
      .map { |oid| ObjectSpace._id2ref(oid) }
      .map { |o| heap_state_entry(o, var_table[o.object_id]) }
  end

  def assemble_var_table
    var_table = Hash.new { |h,k| h[k] = [] }
    instance_variables.each do |var_name|
      oid = eval(var_name.to_s).object_id
      var_table[oid] << var_name.to_s
    end
    var_table
  end

  def heap_state_entry(obj, names)
    {
      oid: obj.object_id,
      references: ref_entries(obj),
      klass: class_from_obj_name(obj.class.to_s),
      value: obj.inspect,
      names: names || []
    }
  end

  def ref_entries(obj)
    Mass
      .references(obj)
      .keys
      .map{|ref_name|
        {klass: class_from_obj_name(ref_name),
         oid: id_from_obj_name(ref_name)}
      }
      .reject{|ref_hash| ref_hash[:oid] == 0}
  end

  def class_from_obj_name(name)
    name[/#{HeapUtils::NAMESPACE.to_s}::([^#]*)/,1]
  end

  def id_from_obj_name(name)
    name[/#{HeapUtils::NAMESPACE.to_s}::.*#(.*)/,1].to_i
  end
end