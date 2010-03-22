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


get '/model/polygons.json' do
  polygons = []
  object.polygons.each do |vector|
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
  colors=[]
  object.vertices.each do 
     [0.5,0.5,0.7,0].each do |c|
       colors << c
     end
  end
  {:colors => colors}.to_json
end
