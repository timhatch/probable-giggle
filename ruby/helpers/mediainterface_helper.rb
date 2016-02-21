require 'json'
require 'csv'

module Perseus
  module MediaInterface
  
    module_function
    
    def trim_params params
      {
        "wet_id" => params["wet_id"],
        "grp_id" => params["grp_id"],
        "route"  => params["route"] 
      }
    end
    
    def parse_result type, result
      regex   = Regexp.new "#{type}([0-9]{1,})"
      matched = regex.match(result)
      if matched
        scored_attempts = matched.captures.to_a.first.to_i
      else
        scored_attempts = nil
      end
    end
    
    def write_to_csvfile params, data
      filename = params["wet_id"].to_s+"."+params["route"].to_s+"."+params["grp_id"].to_s+".csv"
      
      File.new(filename, "w") unless File.exists?(filename)
      File.open(filename,"w") do |file|
      
        file.write "wet_id\,grp_id\,route\,per_id\,lastname\,firstname\,nation\," <<
          "result\,a1\,b1\,t1\,a2\,b2\,t2\,a3\,b3\,t3\,a4\,b4\,t4\," <<
          "rank_prev_heat\,start_order\,t\,ta\,b\,ba\,result_rank\n"
    
        data.each do |row|
          # Parse the results_json data converting it into a fixed length array
          obj     = {}
          results = JSON.parse(row[:result_json])
          (1..4).each do |i|
            key = "p"+i.to_s
            arr = []
            arr[0] = parse_result("a", results[key])
            arr[1] = parse_result("b", results[key]) 
            arr[2] = parse_result("t", results[key])
            obj[key] = arr
          end
          row[:result_json] = obj.values.flatten

          # Flatten the entire dataset
          file.write row.values.flatten.to_csv
        end
      end
    end
  end
end