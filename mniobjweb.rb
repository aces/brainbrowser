require 'rubygems'
require 'sinatra'
require 'lib/mniobject'
require 'lib/macacc_data_set'
require 'lib/color_map'
require 'json'


object = MNIObject.new("surf_reg_model_both.obj")


prefix = "/home/nkassis/dataStore/data1/gaolang_data/"


class Cache
  attr_accessor :colors,:map,:vertex
end

cache = Cache.new

#ALL THIS JUNK NEEDS AUTOMATION
types = { 
  "CT" => "ICBM152_MACACC_CT/",
  "Area" => "ICBM152_MACACC_AREA/",
  "Volume" => "ICBM152_MACACC_AREA/"
}

#smoothing kernels
sks  = { 
  "0mm" => "ICBM152_0mm_MACACC/",
  "5mm" => "ICBM152_5mm_MACACC/",
  "10mm" => "ICBM152_10mm_MACACC/",
  "15mm" => "ICBM152_15mm_MACACC/",
  "20mm" => "ICBM152_20mm_MACACC/",
  "25mm" => "ICBM152_25mm_MACACC/",
  "30mm" => "ICBM152_30mm_MACACC/",
  "35mm" => "ICBM152_35mm_MACACC/",
  "40mm" => "ICBM152_40mm_MACACC/"
}

modalities = { 
  "T" => "T_map/T_",
  "P1" => "RTF_C_map/RTF_C_",
  "P2" => "RTF_V_map/RTF_V_"
}


data=MACACCDataSet.new(prefix,modalities,types,sks)




get '/' do
  @object = object
  erb :index


                            
end


get '/spectrum.json' do
  type=params['spectrum']
  ColorMap.get_spectrum(type.to_sym).to_json
end

get '/model/vertices.json' do
  vertices = []
  object.vertices.each do |vector|
    vector.each do |n|
      vertices << n
    end
  end

  {:vertices => vertices}.to_json
end


get '/model/polygons.json.1' do
  polygons = []
  half=object.polygons.size/2
  object.polygons[0..half-1].each do |vector|
    vector.each do |n|
      polygons << n
    end
  end
  


  {:polygons => polygons}.to_json
end

get '/model/polygons.json.2' do
  polygons = []
  half=object.polygons.size/2
  size = object.polygons.size
  object.polygons[half+1..size-1].each do |vector|
    vector.each do |n|
      polygons << n
    end
  end
  


  {:polygons => polygons}.to_json
end


get '/model/normal_vectors.json' do
  normal_vectors = []
  object.normal_vectors.each do |vector|
    vector.each do |n|
      normal_vectors << n
    end
  end
        
  {:normal_vectors => normal_vectors}.to_json
end

get '/model/colors.json' do
  unless cache.colors
    cache.colors = []
    object.vertices.size.times do 
      [0.5,0.5,0.7,1].each do |c|
        cache.colors << c
      end
    end
  end

  eof = false
  last = params['current_length'].to_i
  max = object.vertices.size*4
  if ((max - last) >= 100000)
      colors = cache.colors[last,100000]
  elsif (0< (max - last)) and ((max-last) < 100000)
    puts "LAST TIME"
    colors = cache.colors[last..(max-1)]
    eof = true
  else
    puts "END OF DATA !!!!!!"
    colors = []
  end
  puts "SIZE OF COLOR ARRAY: #{colors.size}"
  puts "MAX: #{max}"
  puts "LAST: #{last}"   
  
  {:eof => eof, :colors => colors}.to_json
end

get '/model/map.json' do 
  start_time = Time.now
  settings = params["data_setting"]
  last = (params['current_length'].to_i) 
  max = object.vertices.size*4
  colors = []
  eof = false
  
  vertex = params['vertex'] || object.closest_vertice(params['index'],params['position'])
  unless (cache.map and data.current_vertex == vertex and data.current_settings == settings)
    values = data.parse_data(vertex,settings)
    puts "VALUE SIZE: #{values.size}"
    cache.map = []
    cache.map = ColorMap.generate_color_map(values,:gaolang)
  end
  if ((max - last) >= 100000)
      colors = cache.map[last,100000]
  elsif (0< (max - last)) and ((max-last) < 100000)
    puts "LAST TIME"
    colors = cache.map[last..(max-1)]
    eof = true
  else
    puts "END OF DATA !!!!!!"
    colors = []
  end
  puts "SIZE OF COLOR ARRAY: #{colors.size}"
  puts "MAX: #{max}"
  puts "LAST: #{last}" 
  
 
  puts "Time: #{Time.now - start_time}"
  {:vertex => vertex,:eof =>  eof, :colors => colors}.to_json

end
    
