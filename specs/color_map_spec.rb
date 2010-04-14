require "lib/color_map"

values = []
open('specs/data/T_34569.txt', 'r').each do |line|
  values << line.to_f
end

describe ColorMap do 
  
  before(:each) do 
    @values = values 
    @color_map = ColorMap.new(values,:spectral)
  end
  
  it "should return a array of colors" do
    ColorMap.colors.class.should be_== array
  end
end
