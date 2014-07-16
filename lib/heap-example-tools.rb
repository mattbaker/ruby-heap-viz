require 'ruby-mass'
require_relative 'example-classes'

module HeapExampleTools
  NAMESPACE = Example

  #Filter out references that Pry maintains
  def self.references(*args)
    Mass
      .references(*args)
      .reject{|k,v| k.start_with? "Pry"}
  end

  def self.obj_from_id(id)
    ObjectSpace.each_object.find {|o| o.object_id == id}
  end

  def self.class_from_obj_name(name)
    name[/#{HeapExampleTools::NAMESPACE.to_s}::([^#]*)/,1]
  end

  def self.id_from_obj_name(name)
    name[/#{HeapExampleTools::NAMESPACE.to_s}::.*#(.*)/,1].to_i
  end

  def self.ref_entry(name)
    {
      klass: self.class_from_obj_name(name),
      oid: self.id_from_obj_name(name)
    }
  end

  def self.heap_state(var_table)
    Mass.index(HeapExampleTools::NAMESPACE)
      .values
      .flatten
      .map { |oid| HeapExampleTools.obj_from_id(oid) }
      .map { |o| HeapExampleTools.heap_state_entry(o, var_table[o.object_id]) }
  end

  def self.heap_state_entry(obj, names)
    {
      oid: obj.object_id,
      references: HeapExampleTools
                    .references(obj)
                    .keys
                    .map{|ref_name| HeapExampleTools.ref_entry(ref_name)}
                    .reject{|ref_hash| ref_hash[:oid] == 0},
      klass: HeapExampleTools.class_from_obj_name(obj.class.to_s),
      value: obj.inspect,
      names: names || []
    }
  end
end