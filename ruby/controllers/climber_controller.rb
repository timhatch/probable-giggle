# Handlers for '/climber' routes 
#

module Perseus
  class ClimberController < ApplicationController
    
    #  Interrogate in individual result string to construct a result
    #
    def parse_attempts type, result, arr
      regex   = Regexp.new "#{type}([0-9]{1,})"
      matched = regex.match(result)
      if matched
        arr[0] += 1
        arr[1] += matched.captures.to_a.first.to_i
      end
    end
    
    # Generate the overall result as a matrix [tn,ta,bn,ba]
    #
    def update_rjson dataset, new_result
      old_result = JSON.parse(dataset.first[:result_json])
      old_result.merge(new_result)
    end
    
    def update_param result_json
      tarr = [0,0]; barr = [0,0]
      result_json.each do |key,value|
        parse_attempts "t", value, tarr
        parse_attempts "b", value, barr
      end
      tarr + barr
    end
    
    def update_reslt array
      array[0].to_s << 't' << array[1].to_s << ' ' << array[2].to_s << 'b' << array[3].to_s
    end
    
    # Primary routing functions (expressed as lambdas)
    # Fetch a __single__ result from the server
    # 
    get_result_single = lambda do
      hash = Hash[params.map{ |(k,v)| [k.to_sym,v] }]
      resp = DB[:Ranking]
        .where(hash)
        .first
        .to_json
    end 
    
    # Set a __single__ result on the server
    # 
    set_result_single = lambda do
      # Process the input parameters
      result  = JSON.parse(params.delete("result_json"))
      hash    = Hash[params.map{|(k,v)| [k.to_sym,v.to_i]}]
      dataset = DB[:Results]
        .where(hash)
      # Update results values
      new_rjson  = update_rjson(dataset, result)
      new_param  = update_param(new_rjson)
      resp = dataset.update({ 
        result:      update_reslt(new_param), 
        param:       Sequel.pg_array(new_param), 
        result_json: new_rjson.to_json 
      })
      # Return success/error
      resp ? 200 : 404 
    end
    
    get '/', &get_result_single
    put '/bloc', &set_result_single
  end
end