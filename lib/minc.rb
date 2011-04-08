require 'rubygems'
class Minc
  def initialize(filename)
    order = IO.popen("mincinfo -attval image:dimorder #{filename}") {|fh| fh.readlines.join.strip.split(',')}        
    if !(order.size == 3 or order.size == 4)
      order = IO.popen("mincinfo -dimnames #{filename}") {|fh| fh.readlines.join.strip.split(' ')}        
    end
    
    #Gets the attributes in the minc file that we need
    @headers = {
      :xspace => {
        :start        => IO.popen("mincinfo -attval xspace:start #{filename}") { |fh| fh.readlines.join.to_f } ,
        :space_length => IO.popen("mincinfo -dimlength xspace #{filename}"){ |fh| fh.readlines.join.to_i},
        :step         => IO.popen("mincinfo -attval xspace:step #{filename}"){ |fh| fh.readlines.join.to_i}
      },
      :yspace => {
        :start        => IO.popen("mincinfo -attval yspace:start #{filename}"){|fh| fh.readlines.join.to_f},
        :space_length => IO.popen("mincinfo -dimlength yspace #{filename}"){ |fh| fh.readlines.join.to_i},
        :step         => IO.popen("mincinfo -attval yspace:step #{filename}"){ |fh| fh.readlines.join.to_i}
      },
      :zspace => {
        :start        => IO.popen("mincinfo -attval zspace:start #{filename}"){|fh| fh.readlines.join.to_f},
        :space_length => IO.popen("mincinfo -dimlength zspace #{filename}"){ |fh| fh.readlines.join.to_i},
        :step         => IO.popen("mincinfo -attval zspace:step #{filename}"){ |fh| fh.readlines.join.to_i}
      },

      :order => order
    }
    
    if order.length == 4 
      @headers[:time] = { 
        :start        => IO.popen("mincinfo -attval time:start #{filename}") { |fh| fh.readlines.join.to_f } ,
        :space_length => IO.popen("mincinfo -dimlength time #{filename}"){ |fh| fh.readlines.join.to_i}
      }
    end
    
    @filename = filename
  end
  
  attr_reader :data, :data_string, :headers
  def raw_data
    @raw_data = IO.popen("minctoraw -byte -unsigned -normalize #{@filename}"){ |fh| fh.readlines.join } #The raw binary data, in short integer
  end

  def data
    @data = self.raw_data.unpack('v*') #Unpack is used here to convert 4 byte(char) to a short unsigned integer
  end
  
  def data_string
    @data_string = self.data.join(" ") #making a space delimited array of the data (useful to send to server)
    #File.open('data/junk.txt').readlines.join(" ");
  end



  def to_s
    "Dimensions: \nxspace: #{@xspace[length]}\nyspace: #{@yspace[length]}\nzspace: #{@zspace[length]}\n"
  end
  
end


    
    
