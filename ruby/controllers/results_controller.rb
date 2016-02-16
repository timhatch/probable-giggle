# Handlers for '/results' routes 
#

module Perseus
  class ResultsController < ApplicationController
    
    # HELPERS
    # Interrogate in individual result string to construct a result
    #
    def parse_attempts type, result, arr
      regex   = Regexp.new "#{type}([0-9]{1,})"
      matched = regex.match(result)
      if matched
        scored_attempts = matched.captures.to_a.first.to_i
        arr[0] += 1 unless scored_attempts == 0
        arr[1] += scored_attempts
      end
    end
    
    # Parse the provided results string to create a results array
    # in the form [t,ta,b,ba]
    #
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
    
    # Prepare a Sequel query to get __single__ or __multiple__ results
    # 
    def get_result params
      hash = Hash[params.map{ |(k,v)| [k.to_sym,v] }]
      DB[:Ranking]
        .where(hash)
    end
    
    # Set a __single__ result on the server
    # 
    def set_result_single params
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
    
    # ROUTING
    #
    # Fetch a __single__ result
    get '/person' do
      get_result(params).first.to_json
    end
    
    # Update a single result
    put '/person' do
      set_result_single(params)
    end

    # Fetch __multiple__ results (i.e. for a route)
    get '/route' do
      get_result(params).all.to_json
    end
    
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