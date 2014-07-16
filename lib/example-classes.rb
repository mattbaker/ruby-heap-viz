module Example
  class String
    def initialize(str)
      @string = str
    end

    def method_missing(name, *args)
      @string.send(name, *args)
    end
  end

  class Array
    def initialize
      @elements = []
    end

    def method_missing(name, *args)
      @elements.send(name, *args)
    end
  end
end