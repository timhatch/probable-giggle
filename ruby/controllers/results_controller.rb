# Module  Perseus             - The namespace for all application code
# Class   ResultsController   - Subclasses ApplicationController
#
# ResultsController manages routes Requesting/Updating/Deleting results in the
# database
# Currently implements:
# - Getting/Setting a single result (i.e. for one climber and one boulder)
#   (In theory the relevant method in LocalDBConnection will cope with multiple boulders being
#   updated but the corresponding eGroupware method has not been implemented
# - Getting multiple results (e.g. for all climbers in a round)
#
module Perseus
  class ResultsController < Perseus::ApplicationController
    # HELPERS
    helpers Perseus::LocalDBConnection
    helpers Perseus::ResultsHandler

    # symbolize route parameters (deliberately non-recursive)
    before do
      params.keys.each { |k| params[k.to_sym] = params.delete(k) }
    end

    # Fetch a __single__ result
    # Convert the received parameters into hash symbols and call
    # LocalDBConnection.get_result_person
    get '/person' do
      LocalDBConnection::Results.result_person(params).to_json
    end

    # Fetch __multiple__ results (i.e. for a route)
    # Convert the received parameters into hash symbols and call
    # LocalDBConnection.get_result_route
    get '/route' do
      LocalDBConnection::Results.result_route(params).to_json
    end

    # Update a __single__ result
    # Convert the received parameters into hash symbols and call
    # LocalDBConnection.set_result_single
    put '/person' do
      if LocalDBConnection::Results.update_single(params)
        ResultsHandler.broadcast_results(params) ? 200 : 501
      end
    end

    # Lock or unlock results for a complete route to disable/enable editing
    put '/lock' do
      LocalDBConnection::Results.results_lock(params) ? 200 : 501
    end

    # Reset a __single__ result
    # Convert the received parameters into hash symbols and call
    # LocalDBConnection.result_reset
    delete '/person' do
      LocalDBConnection::Results.result_reset(params)
      ResultsHandler.broadcast_route(params) ? 200 : 501
    end

    # Delete any results in the broadcast pipeline
    delete '/broadcast' do
      ResultsHandler.purge_eventstream ? 200 : 501
    end
  end
end
