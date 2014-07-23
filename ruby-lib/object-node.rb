require 'objspace'
require 'json'
require_relative 'example-classes'

class ObjectNode
  NAMESPACE = Example

  attr_reader :oid, :inbound_references
  attr_accessor :outbound_references

  def initialize(obj, names)
    #Be careful not to retain any reference to obj, or
    #GC examples will stop working!
    @oid = obj.object_id
    @display_oid = ObjectNode.display_oid(obj)
    @klass = ObjectNode.klass(obj)
    @value = ObjectNode.value(obj)
    @names = names
    @inbound_references = []
    @outbound_references = []
  end

  def orphan?
    @names.empty? &&
    (@inbound_references.empty? ||
     @inbound_references.all?(&:orphan?))
  end

  def to_json(*args)
    {
      oid: @oid,
      displayOid: @display_oid,
      inboundReferences: @inbound_references.map(&:oid),
      outboundReferences: @outbound_references.map(&:oid),
      klass: @klass,
      value: @value,
      names: @names,
      orphan: orphan?
    }.to_json(*args)
  end

  def self.display_oid(obj)
    "0x#{obj.object_id.to_s(16)[7..-1]}"
  end

  def self.klass(obj)
    obj.class.name.split('::').last
  end

  def self.value(obj)
    if obj.respond_to?(:ref_inspect)
      obj.ref_inspect.to_s
    else
      obj.inspect.to_s
    end
  end

  def self.graph(var_table)
    node_map = ObjectNode.objects_within_namespace.each_with_object({}) do |obj, nodes|
      nodes[obj.object_id] = ObjectNode.new(obj, var_table[obj.object_id])
    end
    ObjectNode.add_references! node_map
    node_map.values
  end

  def self.objects_within_namespace
    NAMESPACE.classes.reduce([]) do |objs, klass|
      objs += ObjectSpace.each_object(klass).to_a
    end
  end

  def self.add_references!(node_map)
    node_map.values.each do |node|
      obj = ObjectSpace._id2ref(node.oid)
      ObjectSpace.reachable_objects_from(obj).each do |referenced_obj|
        referenced_node = node_map[referenced_obj.object_id]
        if referenced_node
          node.outbound_references << referenced_node
          referenced_node.inbound_references << node
        end
      end
    end
  end
end