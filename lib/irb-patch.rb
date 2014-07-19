module IRB
  class Context
    def set_last_value(value)
      @last_value = nil
      @workspace.evaluate self, "_ = IRB.CurrentContext.last_value"
      print value.inspect + "\n"
    end
  end
end
