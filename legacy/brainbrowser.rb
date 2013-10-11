$LOAD_PATH.insert(0,(File.dirname(__FILE__)+"/lib"))
require 'rubygems'
require 'sinatra'
require 'minc'
require 'json'
require 'zlib'

if ENV["BRAINBROWSER_ENV"] == "production"
  puts "== Starting BrainBrowser in production mode"
  set :public_folder, 'production/public'
else
  set :public_folder, 'development/public'
  puts "== Starting BrainBrowser in development mode"
  #use Rack::Auth::Basic, "Restricted Area" do |username, password|
  #  [username, password] == ['tsherif', 'sosecret']
  #end

end


not_found do 
  "Document not found" 
end

get '/' do
  erb :index
end

get '/about' do
  erb :about
end

get '/credits' do
  erb :credits
end

get '/macaccview.html' do
  erb :macaccview, :layout => false
end

get '/surfview.html' do
  erb :surfview, :layout => false
end


#Runs volume object evaluate on a minc file provided by the user.
#The file is uploaded then run through the tool, and the output is
#sent back to the user. Also, deletes the output file
post '/minc/volume_object_evaluate' do
  datafile = request["datafile"][:tempfile].path
  objfile = request["objfile"][:tempfile].path
  outfile = "tmp/xyz#{rand 100000000000000000000}.txt"
  
  
  if !(datafile && objfile)
    raise "No datafile or obfile"
  end

  puts "volume_object_evaluate #{datafile}  #{objfile} #{outfile}"

  system("volume_object_evaluate #{datafile}  #{objfile} #{outfile}")
  
  data = open(outfile) { |fh| fh.readlines.join("\n") }
  system("rm #{outfile}")
  data
  
  
end


#Runs volume object evaluate on a minc (after nii2mnc conversion) file provided by the user.
#The file is uploaded then run through the tool, and the output is
#sent back to the user. Also, deletes the output file
post '/nii/volume_object_evaluate' do
  datafile = headers["datafile"][:tempfile].path
  objfile = headers["objfile"][:tempfile].path
  tmpnii = "tmp/xyz#{rand 100000000000000000000}.nii"
  tmpmnc = "tmp/xyz#{rand 100000000000000000000}.mnc"
  outfile = "tmp/xyz#{rand 100000000000000000000}.txt"

  

  if !(datafile && objfile)
    raise "No datafile or obfile"
  end
  
  puts "volume_object_evaluate #{datafile}  #{objfile} #{outfile}"
  
  system("mv #{datafile} #{tmpnii}")
  
  #file conversion
  system("nii2mnc #{tmpnii} #{tmpmnc}")
  #eval
  system("volume_object_evaluate #{tmpmnc}  #{objfile} #{outfile}")
  
  data = open(outfile) {|fh| fh.readlines.join("\n")};
  system("rm #{tmpnii}")
  system("rm #{tmpmnc}")
  system("rm #{outfile}")
  data
  
  
end



#Extracts the content of a minc file
get '/data/:filename' do
  if params[:minc_headers]
    

    if params[:filename] == @filename
      return @minc.headers
    else
      filename = "data/#{params[:filename]}"
      
      if file_accessible? filename do 
          @minc = Minc.new(filename)
          @filename = params[:filename]
    end
        
      else
        raise Sinatra::NotFound
      end
      return @minc.headers.to_json
    end
   
  elsif params["raw_data"]
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
    
    headers 'content-type' => "text/plain"
    
    @minc.raw_data
  end
end

#2d mri browser
get '/braincanvas' do
  erb :braincanvas,:layout => false
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
