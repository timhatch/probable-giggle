# Handlers for '/results' routes 
#

module Perseus
  class ResultsController < ApplicationController
    
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
    
    def update_sort_values result_json
      tarr = [0,0]; barr = [0,0]
      result_json.each do |key,value|
        parse_attempts("t", value, tarr)
        parse_attempts("b", value, barr)
      end
      tarr + barr
    end
    
    # Generate the overall result as a matrix [tn,ta,bn,ba]
    #
    def update_rjson dataset, new_result
      old_result = JSON.parse(dataset.first[:result_json])
      old_result.merge(new_result)
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
    
    get_result_multi = lambda do
      hash = Hash[params.map{ |(k,v)| [k.to_sym,v] }]
      resp = DB[:Ranking]
        .where(hash)
        .all
        .to_json
    end
    
    # Set a __single__ result on the server
    # 
    set_result_single = lambda do
      #TODO: Add guardian to avoid overwriting data
      # Process the input parameters
      result  = JSON.parse(params.delete("result_json"))
      hash    = Hash[params.map{|(k,v)| [k.to_sym,v.to_i]}]
      dataset = DB[:Results]
        .where(hash)

      # Update results values
      new_rjson  = update_rjson(dataset, result)
      new_param  = update_sort_values(new_rjson)
      resp = dataset.update({ 
        sort_values: Sequel.pg_array(new_param), 
        result_json: new_rjson.to_json 
      })
      # Return success/error
      resp ? 200 : 404 
    end
    
    # TODO: Not working!!!
    set_result_multi = lambda do
      p Hash[params.map{|(k,v)| [k.to_sym,v]}]
#      results = params.delete("result_json")
#      hash    = Hash[params.map{|(k,v)| [k.to_sym,v]}]
#      #TODO: Add guardian to avoid overwriting data
#      p hash
#      results.each do |obj|
#        
#        results_hash = Hash[obj.map{|(k,v)| [k.to_sym,v]}]
#        p results_hash
#      end
      404
    end
    
    get '/person', &get_result_single
    put '/person', &set_result_single
    get '/route',  &get_result_multi
    put '/route',  &set_result_multi
    
    # placeholder - will need to be renamed
    get '/m' do
      haml :nexus
    end
    # placeholder - will need to be renamed
    get '/flash' do
      haml :mithril
    end
    # placeholder - may need to be renamed
    get '/' do
      haml :results
    end
  end
end