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
    
    # Generate the overall result as a matrix [tn,ta,bn,ba]
    #
    def update_rjson dataset, new_result
      old_result = JSON.parse(dataset.first[:result_json])
      old_result.merge(new_result)
    end
    
    def update_sort_values result_json
      tarr = [0,0]; barr = [0,0]
      result_json.each do |key,value|
        parse_attempts "t", value, tarr
        parse_attempts "b", value, barr
      end
      tarr + barr
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
    
    set_result_multi = lambda do
      p 'not implemented yet'
      404
    end
    
    get '/person', &get_result_single
    put '/person', &set_result_single
    get '/route',  &get_result_multi
    put '/route',  &set_result_multi
    
    # placeholder - will need to be renamed
    get '/nexus' do
      haml :nexus
    end
    # placeholder - will need to be renamed
    get '/mithril' do
      # TODO Set these parameters based on earlier input. e.g. get values from a database 
      @title = 'Test Comp'
      @wetid = 1
      # e.g. re-route to /mithril/params
      haml :mithril
    end
  end
end