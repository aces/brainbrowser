class ColorMap
  gaolang_spectrum = []
  open('assets/gaolang_spectrum.txt', 'r').each do |line|
    r,g,b = line.split(" ")
    gaolang_spectrum << [r.to_f,g.to_f,b.to_f,1.0]
  end
  @@types = { :spectral => [[ 0.0000,0.0000,0.0000, 1.0],
                            [  0.4667,0.0000,0.5333, 1.0],
                            [  0.5333,0.0000,0.6000, 1.0],
                            [  0.0000,0.0000,0.6667, 1.0],
                            [  0.0000,0.0000,0.8667, 1.0],
                            [  0.0000,0.4667,0.8667, 1.0],
                            [  0.0000,0.6000,0.8667, 1.0],
                            [  0.0000,0.6667,0.6667, 1.0],
                            [  0.0000,0.6667,0.5333, 1.0],
                            [  0.0000,0.6000,0.0000, 1.0],
                            [  0.0000,0.7333,0.0000, 1.0],
                            [  0.0000,0.8667,0.0000, 1.0], 
                            [  0.0000,1.0000,0.0000, 1.0],
                            [  0.7333,1.0000,0.0000, 1.0],
                            [  0.9333,0.9333,0.0000, 1.0],
                            [  1.0000,0.8000,0.0000, 1.0],
                            [  1.0000,0.6000,0.0000, 1.0],
                            [  1.0000,0.0000,0.0000, 1.0],
                            [  0.8667,0.0000,0.0000, 1.0],
                            [  0.8000,0.0000,0.0000, 1.0],
                            [  0.8000,0.8000,0.8000, 1.0]],
    :gaolang => gaolang_spectrum

  }

  

  
  #########################################################
  # Creates a map using the type specified (ex: spectral)
  # Approved by Mr Pierre Rioux
  #
  # ex: colors = generate_color_map(data_array,:spectral)
  #
  #########################################################
  def self.generate_color_map(values,type)    
    type= @@types[type]
    colors = []
    max_value = values.max
    min_value = values.min
    increment = ((max_value-min_value)+(max_value-min_value)/type.size)/type.size  
    values.each do |value|
      color_index = ((value-min_value)/increment).to_i
      type[color_index].each do |c|
        colors << c
      end
    end

    return colors

  end
 
  def self.get_spectrum(type)
    @@types[type]
  end

end



