class MACACCDataSet
  def initialize(prefix,modalities,types,sks)
    @filesystem_prefix = prefix
    @modality_prefixes = modalities
    @type_prefixes = types
    @sk_prefixes = sks
  end
  
  attr_accessor :current_vertex,:current_data,:current_settings

  def parse_data(vertex,settings)
    @current_vertex = vertex
    @current_settings = settings
    @current_data = []
    open(get_path(vertex,settings),'r').each do |line|
      @current_data << line.to_f
    end
    return @current_data
    
  end

  private
  
  #This gives you the filename for the vertex requested
  def get_path(vertex,settings)
    modality_prefix = @modality_prefixes[settings["modality"]]
    type_prefix = @type_prefixes[settings["type"]]
    sk_prefix = @sk_prefixes[settings["sk"]]
    vertex_string = "#{vertex}.txt"
    
    filename = @filesystem_prefix +type_prefix+sk_prefix+modality_prefix+vertex_string
    puts "FILENAME: #{filename}"
    return filename
  end

end
