require 'rubygems'
require 'sinatra'
require 'lib/minc'
require 'json'
require 'zlib'

set :public, File.dirname(__FILE__) + '/public'


not_found do 
  "Document not found" 
end


post '/upload/minc' do
  file = params["datafile"][:filename]
  tempfile = params["datafile"][:tempfile].path
  outfile = "tmp/xyz#{rand 100000000000000000000}.txt"
  puts "File #{file}"
  puts "tempfile #{tempfile}"
  
  if file.nil? 
    puts "FILE IS NIL"
  end

  if tempfile.nil?
    puts "TEMPFILE NIL"
  end

  puts params["datafile"][:tempfile].path;
  puts "volume_object_evaluate #{tempfile}  public/models/surf_reg_model_both.obj #{outfile}"

  `volume_object_evaluate #{tempfile}  public/models/surf_reg_model_both.obj #{outfile}`

  open(outfile).readlines.join("\n");
  
end

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
  
  io = StringIO.new
  gzip = Zlib::GzipWriter.new(io)
  gzip.mtime = Time.now

  #The magic happens here somewhere
  @minc.data_string.each { |part| gzip << part}
  #The magic is done happening
  gzip.close


  headers 'Content-encoding' => 'gzip', 'content-type' => "text/plain;charset=utf-8"




  io.string
end

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

get '/braincanvas' do
  erb :braincanvas
end


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
