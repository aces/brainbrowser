require 'rubygems'
class Minc
  def initialize(filename)
    #Gets the attributes in the minc file that we need
    @params = {
      :xspace => {
        :start => `mincinfo -attval xspace:start #{filename}`.to_f,
        :space_length => `mincinfo -dimlength xspace #{filename}`.to_i
      },
      :yspace => {
        :start => `mincinfo -attval yspace:start #{filename}`.to_f,
        :space_length => `mincinfo -dimlength yspace #{filename}`.to_i
      },
      :zspace => {
        :start => `mincinfo -attval zspace:start #{filename}`.to_f,
        :space_length => `mincinfo -dimlength zspace #{filename}`.to_i
      },

      :order => `mincinfo -attval image:dimorder #{filename}`.strip.split(',')
    }
    @filename = filename
  end
  
  attr_reader :data, :data_string, :params
  def raw_data
    @raw_data = `minctoraw -short -normalize #{@filename}` #The raw binary data, in short integers
  end

  def data
    @data = self.raw_data.unpack('n*') #Unpack is used here to convert 4 byte(char) to a short unsigned integer
  end
  
  def data_string
    @data_string = self.data.join(" ") #making a space delimited array of the data (useful to send to server)
  end



  def to_s
    "Dimensions: \nxspace: #{@xspace[length]}\nyspace: #{@yspace[length]}\nzspace: #{@zspace[length]}\n"
  end

  def get_slice(axis,number)
    #no implemented yet
  end
  
end


    
    
