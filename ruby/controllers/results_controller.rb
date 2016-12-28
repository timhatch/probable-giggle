# Module  Perseus                 - The namespace for all application code
# Class   ResultsController   - Subclasses ApplicationController
# 
# ResultsController manages routes Requesting/Updating/Deleting results in the
# database 
# Currently implements: 
# - Getting/Setting a single result (i.e. for one climber and one boulder)
#   (In theory the relevant method in LANStorageAPI will cope with multiple boulders being updated
#   but the corresponding eGroupware method has not been implemented
# - Getting multiple results (e.g. for all climbers in a round) 
#
module Perseus
  class ResultsController < Perseus::ApplicationController
    
    # HELPERS
    helpers Perseus::LANStorageAPI
    
    # symbolize route paramaters (deliberately non-recursive)
    #
    before do
      params.keys.each{ |k| params[k.to_sym] = params.delete(k) }
    end
    
    # Fetch a __single__ result
    # Convert the received parameters into hash symbols and call LANStorageAPI.get_result_person
    # 
    get '/person' do
      LANStorageAPI.get_result_person(params).first.to_json
    end
    
    # Fetch __multiple__ results (i.e. for a route)
    # Convert the received parameters into hash symbols and call LANStorageAPI.get_result_route
    # 
    get '/route' do
      LANStorageAPI.get_result_route(params).all.to_json
    end
    
    # Update a __single__ result
    # Convert the received parameters into hash symbols and call LANStorageAPI.set_result_single
    #
    put '/person' do
      LANStorageAPI.set_result_person(params) ? 200 : 501
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
