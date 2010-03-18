require 'rubygems'
require 'sinatra'
require 'lib/mniobject'

object = MNIObject.new("surf_reg_model_both.obj")


get '/' do
  @object = object
  erb :index
end
