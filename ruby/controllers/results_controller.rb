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

    # Fetch either __multiple__ or (if either per_id or start_order are given) a __single__ result
    # Convert the received parameters into hash symbols and call
    # LocalDBConnection::Results.fetch
    # Returns either an array of results or a single result as appropriate
    fetch = lambda do
      data = LocalDBConnection::Results.fetch(params)
      (data.count == 1 ? data.first : data).to_json
    end

    # Handle either a generic GET request or one with a per_id sub-route
    get '/', &fetch
    get '/:per_id', &fetch

    # FIXME: To delete (just use fetch)
    # Fetch a __single__ result
    # Convert the received parameters into hash symbols and call
    # LocalDBConnection.fetch
    get '/person' do
      LocalDBConnection::Results.fetch(params).first.to_json
    end

    # FIXME: To delete (just use fetch)
    # Fetch __multiple__ results (i.e. for a route)
    # Convert the received parameters into hash symbols and call
    # LocalDBConnection.fetch
    get '/route' do
      LocalDBConnection::Results.fetch(params).to_json
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
