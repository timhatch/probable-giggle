# Module  Perseus                 - The namespace for all application code
# Class   ResultsController   - Subclasses ApplicationController
# 
# ResultsController manages routes Requesting/Updating/Deleting results in the
# database 
# Currently implements: 
# - Getting/Setting a single result (i.e. for one climber and one boulder)
# - Setting a singe result and outputting to a CSV file (as a ninterface to livestream)
# - Gettting multiple results (e.g. for a climber, or for all climbers in a round) 
# - Routes serving web pages for data input via tablet, for a flash qualification
#   format and for the "classic" IFSC format.
#
module Perseus
  class ResultsController < Perseus::ApplicationController
    
    # HELPERS
    helpers Perseus::MediaRunner

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
    def get_result params, order_by: "result_rank"
      hash = Hash[params.map{ |(k,v)| [k.to_sym,v] }]
      DB[:Ranking]
        .where(hash)
        .order(order_by.to_sym)
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
      resp = set_result_single(params)
      
      # Simple hack to dump results data to a csv file
      Perseus::MediaRunner.export_consolidated_results({
        wet_id: params["wet_id"], grp_id: params["grp_id"]
      })
      resp
    end
    
    # Update a simple result (but don't update the media file)
    #
    put '/person_nomedia' do
      resp = set_result_single(params)
    end
    
    # Fetch __multiple__ results (i.e. for a route)
    get '/route' do
      get_result(params).all.to_json
    end
    
    # Serve a data input sheet formatted for a Nexus Tablet, IFSC scoring format
    # 
    get '/m' do
      haml :nexus
    end
    
    # Serve a data input sheet for a single climber, assuming the "old school"
    # CWIF scramble/jam format.
    get '/f' do
      haml :mithril
    end
    
    # Serve a data input sheet shwoining the startlist, results list and judging sheet
    #
    get '/' do
      haml :results
    end
  end
end
