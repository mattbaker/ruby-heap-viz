module Example
  class String < String; end
  class Array < Array; end
  class Hash < Hash; end

  def self.classes
    Example
      .constants
      .map { |constant_name| Example.const_get(constant_name) }
      .select { |constant| constant.is_a? Class }
  end
end