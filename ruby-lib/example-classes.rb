module Example

  module HexOid
    def hex_oid
      "0x#{self.object_id.to_s(16)[7..-1]}"
    end
  end

  class String < String
    include HexOid

    def ref_inspect
      inspect
    end
  end

  class Array < Array
    include HexOid

    def ref_inspect
      #We have to ensure nothing retains a ref to this object
      str = "["
      self.each_with_index do |el, i|
        str << el.hex_oid
        str << ", " unless i == self.length - 1
      end
      str << "]"
      str
    end
  end

  class Hash < Hash
    include HexOid

    def ref_inspect
      "{#{self.map{|k,o| k.inspect + '=> '+o.hex_oid}.join(', ')}}"
    end
  end

  def self.classes
    Example
      .constants
      .map { |constant_name| Example.const_get(constant_name) }
      .select { |constant| constant.is_a? Class }
  end
end
