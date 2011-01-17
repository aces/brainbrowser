require 'rubygems'
class Minc
  def initialize(filename)
    #Gets the attributes in the minc file that we need
    @params = {
      :xspace => {
        :start        => IO.popen("mincinfo -attval xspace:start #{filename}").readlines.join.to_f,
        :space_length => IO.popen("mincinfo -dimlength xspace #{filename}").readlines.join.to_i
      },
      :yspace => {
        :start        => IO.popen("mincinfo -attval yspace:start #{filename}").readlines.join.to_f,
        :space_length => IO.popen("mincinfo -dimlength yspace #{filename}").readlines.join.to_i
      },
      :zspace => {
        :start        => IO.popen("mincinfo -attval zspace:start #{filename}").readlines.join.to_f,
        :space_length => IO.popen("mincinfo -dimlength zspace #{filename}").readlines.join.to_i
      },

      :order => IO.popen("mincinfo -attval image:dimorder #{filename}").readlines.join.strip.split(',')
    }
    @filename = filename
  end
  
  attr_reader :data, :data_string, :params
  def raw_data
    @raw_data = IO.popen("minctoraw -short -unsigned -normalize #{@filename}").readlines.join #The raw binary data, in short integer
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

  def get_slice(axis,number)
    #no implemented yet
  end
  
end


    
    
