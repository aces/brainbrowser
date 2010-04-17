require 'rubygems'
require 'sinatra'
require 'lib/mniobject'
require 'lib/macacc_data_set'
require 'lib/color_map'
require 'json'


object = MNIObject.new("surf_reg_model_both.obj")


prefix = "/home/nkassis/dataStore/data1/gaolang_data/"


class Cache
  attr_accessor :colors,:map,:vertex,:max_value,:min_value
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

get '/model/polygons.length.json' do
  [(object.polygons.size*3)].to_json
end

get '/model/polygons.json' do
  inc = 60000
  polygons = []
  current_size = params['current_size'].to_i
  if(current_size < object.polygons.size*3) 
    object.polygons[current_size/3,inc/3].each do |vector|
      vector.each do |n|
        polygons << n.to_i
      end
    end
  elsif(current_size > (object.polygons.size * 3)) 
    eof = true
    polygons = []
  else
    raise "current_size out of range"
  end
  puts "POLYGONS: #{polygons.size} LAST: #{current_size}"
  {:eof => eof, :polygons => polygons, :request => params['request']}.to_json
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
  [0.5,0.5,0.7,1].to_json
end

get '/model/vertex.json' do
  object.closest_vertice(params['index'],params['position']).to_json
end

get '/model/map.json' do 
  start_time = Time.now
  settings = params["data_setting"]
  last = (params['current_length'].to_i) 
  max = object.vertices
  eof = false
  
  vertex = params['vertex'] 
  unless (cache.map and data.current_vertex == vertex and data.current_settings == settings)
    cache.map = data.parse_data(vertex,settings)
    puts "VALUE SIZE: #{cache.map.size}"
    #cache.max_value = cache.map.max
    #cache.min_value = cache.map.min
  end
  #{:data => cache.map, :max => cache.max_value, :min => cache.min_value}.to_json
  cache.map.to_json
end
