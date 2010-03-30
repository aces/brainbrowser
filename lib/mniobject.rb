#!/usr/bin/ruby



class MNIObject

  def initialize(filename)
    @obj_class
    @rgba
    @polygon_indexes = []
    @vertices = []
    @normal_vectors = []
    @polygons = []
    
    if filename
      parse(filename) 
    end
  end

  attr_reader :vertices, :polygons, :normal_vectors, :rgba


  def parse(filename)
    obj_file = open(filename,'r')
    line_array = obj_file.readlines {|line| line.gsub!(/\n/,"")}
    obj_stack = [] 
    line_array.each do |line|
      stuff = line.split(" ")
      stuff.each do |s|
        obj_stack << s
      end
    end
    
    obj_stack.reverse!
    
    @obj_class = obj_stack.pop
    #I don't care about the other 5 element
    5.times{ obj_stack.pop}
    num_of_vert=obj_stack.pop.to_i

    parse_vertices(obj_stack, num_of_vert)
    parse_normal_vectors(obj_stack, num_of_vert)
    
    #Number of polygons
    num_of_poly = obj_stack.pop.to_i
    #Useless field
    obj_stack.pop
    #RGBA setting
    @rgba = [obj_stack.pop.to_f,obj_stack.pop.to_f,obj_stack.pop.to_f,obj_stack.pop.to_f]
    parse_polygon_indexes(obj_stack)
    parse_polygons(obj_stack)

  end
    
  def closest_vertice(index,position)
    polygon=@polygons[index.to_i]
    vertex1=@vertices[polygon[0]]
    vertex2=@vertices[polygon[1]]
    vertex3=@vertices[polygon[2]]
    
    a=distance3(vertex1,position)
    b=distance3(vertex2,position)
    c=distance3(vertex3,position)
    
    if a < b
      ((b<c)? polygon[1] : polygon[2])
    else
      ((a<c)? polygon[0] : polygon[2])
    end
  end

 

  private

  def parse_vertices(obj_stack,num_of_vert)
    num_of_vert.times do 
      @vertices << [obj_stack.pop.to_f,obj_stack.pop.to_f,obj_stack.pop.to_f]
    end
  end
  
  def parse_normal_vectors(obj_stack, num_of_vert)
    num_of_vert.times do 
      @normal_vectors << [obj_stack.pop.to_f,obj_stack.pop.to_f,obj_stack.pop.to_f]
    end

  end
  
  def parse_polygon_indexes(obj_stack)
    #Polygon indexes
    
    a=0 
    index = 0
    while(1)
      index = obj_stack.pop.to_i
      if index < a
        obj_stack.push(index)
        break
      else
        @polygon_indexes << index
      end
      a = index
    end
  end
  
  def parse_polygons(obj_stack)
    first=0
    @polygon_indexes.each do |i|
      new = []
      (i-first).times do 
        new << obj_stack.pop.to_i
      end
      first = i
      
      @polygons << new
    end
  end




  def distance3(a,b)
    a=[a[0].to_f,a[1].to_f,a[2].to_f]
    b=[b[0].to_f,b[1].to_f,b[2].to_f]
    Math.sqrt((a[0]-b[0])**2+(a[1]-b[1])**2+(a[2]-b[2])**2)
  end

end


#test
if $0 == "./obj_parser.rb"

  object=MNIObject.new("surf_reg_model_both.obj")
  
  i=1
  object.vertices.each do |vertex|
  vertex = vertex.join(" ")
    puts "Vertex #{i}: #{vertex}"
    i+=1
  end
  
  
  i=1
  object.polygons.each do |polygon|
    polygon = polygon.join(" ")
    puts "Polygon #{i}: #{polygon}"
    i+=1
  end
end
