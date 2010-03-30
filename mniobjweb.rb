require 'rubygems'
require 'sinatra'
require 'lib/mniobject'
require 'json'


object = MNIObject.new("surf_reg_model_both.obj")


get '/' do
  @object = object
  erb :index
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

get '/model/colors.json.1' do
  colors=[]
  if !params['index']
    (object.vertices.size/2).times do 
      [0.5,0.5,0.7,1].each do |c|
        colors << c
      end
    end
  else
    vertex = object.closest_vertice(params['index'],params['position'])
    colors = generate_color_map(vertex)
    colors = colors[0..colors.size/2-1]
    puts colors.size
  end
  {:vertex => vertex,:colors => colors}.to_json
end
get '/model/colors.json.2' do
  colors = []
  if !params['index']
    (object.vertices.size/2).times do 
      [0.5,0.5,0.7,1].each do |c|
        colors << c
      end
    end
  else
    vertex = object.closest_vertice(params['index'],params['position'])
    colors = generate_color_map(vertex)
    colors = colors[colors.size/2..colors.size-1]
    puts colors.size

  end
  {:vertex => vertex,:colors => colors}.to_json
end



def generate_color_map(vertex)
  #data_file = open("/home/nkassis/goalang/T_#{vertex}.txt",'r')
  data_file = open("T_34569.txt",'r')
  values = []
  data_file.each do |value|
    if value
      values << value.to_f
    end
  end
  colors = []

  values.each do |value|
    value+=5
    if value < 57
      colors << (value/105.0)
      colors << (1-((value-57).abs/57))
      colors << (1-value/105.0)
      colors << 1
    else
      colors << (value/105.0)
      colors << ((value-57).abs/57)
      colors << (1-value/105.0)
      colors << 1
    end
  end
  return colors
end
    
  
  
