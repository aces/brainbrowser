require 'rubygems'
require 'sinatra'
require 'lib/minc'
require 'json'


get '/' do
  erb :index
end

get '/data/:filename/content' do
  if params[:filename] == @filename
    return @minc.data_string
  else
    @minc = Minc.new("data/#{params[:filename]}")
    @filename = params[:filename]
    return @minc.data_string
  end
end

get '/data/:filename/params' do
  if params[:filename] == @filename
    return @minc.params
  else
    @minc = Minc.new("data/#{params[:filename]}")
    @filename = params[:filename]
    return @minc.params.to_json
  end
end
