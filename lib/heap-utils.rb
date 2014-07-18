require 'json'
require 'objspace'
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
    ref_table = assemble_ref_table
    objects_within_namespace.map do |obj|
      heap_state_entry(obj, var_table[obj.object_id], ref_table[obj.object_id])
    end
  end

  def objects_within_namespace
    NAMESPACE.classes.reduce([]) do |objs, klass|
      objs += ObjectSpace.each_object(klass).to_a
    end
  end

  def assemble_var_table
    var_table = Hash.new { |h,k| h[k] = [] }
    instance_variables.each do |var_name|
      oid = eval(var_name.to_s).object_id
      var_table[oid] << var_name.to_s
    end
    var_table
  end

  def assemble_ref_table
    ref_table = Hash.new { |h,k| h[k] = [] }
    objects_within_namespace.each do |obj|
      ObjectSpace.reachable_objects_from(obj).each do |refd_object|
        if within_namespace? refd_object
          ref_table[refd_object.object_id] << obj.object_id
        end
      end
    end
    ref_table
  end

  def heap_state_entry(obj, names, references)
    {
      oid: obj.object_id,
      references: references,
      klass: class_from_obj_name(obj.class.to_s),
      value: obj.inspect,
      names: names
    }
  end

  def within_namespace?(obj)
    obj.class.to_s.start_with? "#{HeapUtils::NAMESPACE}::"
  end

  def class_from_obj_name(name)
    name[/#{HeapUtils::NAMESPACE.to_s}::([^#]*)/,1]
  end

  def id_from_obj_name(name)
    name[/#{HeapUtils::NAMESPACE.to_s}::.*#(.*)/,1].to_i
  end
end