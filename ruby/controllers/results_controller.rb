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

     # Prepare a Sequel query to get __single__ or __multiple__ results
    # 
    def get_result params, order_by: "result_rank"
      hash = Hash[params.map{ |(k,v)| [k.to_sym,v] }]
      DB[:Results].join(:Climbers, [:per_id])
        .where(hash)
      #  .order(order_by.to_sym)
    end
    
    # Interrogate in individual result string to construct a result
    #
    def parse_attempts results_hash, key, arr
      if (results_hash.has_key?(key) && !results_hash[key].nil?)
        arr[0] += 1
        arr[1] += results_hash[key]
      end
    end
    
    # Parse the provided results string to create a results array
    # in the form [t,ta,b,ba]
    #
    def set_sort_values result_json
      tarr = [0,0]
      barr = [0,0]

      result_json.each do |key,result|
        parse_attempts(result, "t", tarr)
        parse_attempts(result, "b", barr)
      end
      tarr + barr
    end
    
    # Update the aggregate result
    def merge_jsonb dataset, result
      dataset
        .first[:result_jsonb]
        .merge(result)
    end
    
    # Set a __single__ result on the server
    # 
    def set_result_single params
      # Process the input parameters
      result  = params.delete("result_jsonb")
      hash    = Hash[params.map{|(k,v)| [k.to_sym,v.to_i]}]
      dataset = DB[:Results].where(hash)

      # Update results values
      new_result = merge_jsonb(dataset, result)
      new_params = set_sort_values(new_result)
      resp = dataset.update({
        sort_values:  Sequel.pg_array(new_params),
        result_jsonb: Sequel.pg_jsonb(new_result) 
      })
    #  # Return success/error
      resp ? 200 : 501
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
      #Perseus::MediaRunner.export_consolidated_results({
      #  wet_id: params["wet_id"], grp_id: params["grp_id"]
      #})
      #resp
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
