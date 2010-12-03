require 'rubygems'
require 'sinatra'
require 'lib/minc'
require 'json'
require 'zlib'


not_found do 
  "Document not found" 
end


get '/' do
  erb :index
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
    @minc.params.to_json
  end
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
