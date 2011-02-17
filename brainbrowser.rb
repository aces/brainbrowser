$LOAD_PATH.insert(0,(File.dirname(__FILE__)+"/lib"))
require 'rubygems'
require 'sinatra'
require 'minc'
require 'json'
require 'zlib'


use Rack::Auth::Basic, "Restricted Area" do |username, password|
  [username, password] == ['macacc', 'br41ns']
end

set :public, File.dirname(__FILE__) + '/public'


not_found do 
  "Document not found" 
end

get '/' do
  redirect '/macacc.html'
end


#Runs volume object evaluate on a minc file provided by the user.
#The file is uploaded then run through the tool, and the output is
#sent back to the user. Also, deletes the output file
post '/minc/volume_object_evaluate' do
  datafile = params["datafile"][:tempfile].path
  objfile = params["objfile"][:tempfile].path
  outfile = "tmp/xyz#{rand 100000000000000000000}.txt"
  
  
  if !(datafile && objfile)
    raise "No datafile or obfile"
  end

  puts "volume_object_evaluate #{datafile}  #{objfile} #{outfile}"

  `volume_object_evaluate #{datafile}  #{objfile} #{outfile}`
  
  data = open(outfile).readlines.join("\n");
  `rm #{outfile}`
  data
  
  
end


#Extracts the content of a minc file
get '/data/:filename/content' do
  if !(params[:filename] == @filename)
    filename = "data/#{params[:filename]}"
    if file_accessible? filename do 
        @minc = Minc.new(filename)
        @filename = params[:filename]
      end
    else
      raise Sinatra::NotFound
    end
  end
  
  headers  'content-type' => "text/plain"

  @minc.raw_data
end

#gets a few important params from a minc file
get '/data/:filename/params' do
  if params[:filename] == @filename
    return @minc.params
  else
    filename = "data/#{params[:filename]}"
    
    if file_accessible? filename do 
      @minc = Minc.new(filename)
      @filename = params[:filename]
    end

    else
      raise Sinatra::NotFound
    end
    puts @minc.params
    @minc.params.to_json
  end
end

#2d mri browser
get '/braincanvas' do
  erb :braincanvas
end

#3d mri browser
get '/braincloud' do
  erb :braincloud
end


#Checks if a file is accessible and if 
#the path is safe. Won't allow symlinks
#or using ..
#If you think of something else that should be disabled
#add it here. 
def file_accessible?(filename, &block)

  if  !filename.include?('..') &&
      FileTest.exists?(filename) && 
      FileTest.readable?(filename) && 
     !FileTest.directory?(filename) && 
     !FileTest.symlink?(filename) 
  
    yield

  else
    false
  end
end
