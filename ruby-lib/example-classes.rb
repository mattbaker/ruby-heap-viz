module Example

  class String < String;
    def ref_inspect
      inspect
    end
  end

  class Array < Array;
    def ref_inspect
      "[#{self.map{|o| Example.hexedOid(o)}.join(', ')}]"
    end
  end

  class Hash < Hash
    def ref_inspect
      "{#{self.map{|k,o| k.inspect + '=> '+Example.hexedOid(o)}.join(', ')}}"
    end
  end

  def self.hexedOid(o)
    "0x#{o.object_id.to_s(16)[7..-1]}"
  end

  def self.classes
    Example
      .constants
      .map { |constant_name| Example.const_get(constant_name) }
      .select { |constant| constant.is_a? Class }
  end
end