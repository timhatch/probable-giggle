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
    helpers Perseus::ResultsHandler

    # symbolize route parameters (deliberately non-recursive)
    # FIXME: Not sure this actually works
    before do
      params.keys.each { |k| params[k.to_sym] = params.delete(k) }
    end

    # Fetch either __multiple__ or (if either per_id or start_order are given) a __single__ result
    # Returns either an array of results or a single result as appropriate
    fetch = -> { LocalDBConnection::Results.fetch(params).to_json }

    # Handle either a generic GET request or one with a per_id sub-route
    get '/', &fetch
    get '/:per_id', &fetch

    # Update a __single__ result
    put '/person' do
      LocalDBConnection::Results.update_single(params) ? 200 : 501
      # if LocalDBConnection::Results.update_single(params)
      #   ResultsHandler.broadcast_results(params) ? 200 : 501
      # end
    end

    # Lock or unlock results for the round | athlete defined by @params
    # TODO: Change this from POST to PUT
    put '/lock' do
      LocalDBConnection::Results.lockstate(params)
    end

    # Erase all results for the round | athlete defined by @params
    put '/reset' do
      LocalDBConnection::Results.reset(params) ? 200 : 501
      # ResultsHandler.broadcast_route(params) ? 200 : 501
    end

    # Delete one or more resulta
    put '/delete' do
      LocalDBConnection::Results.delete(params) ? 200 : 501
    end

    # Update results from some json file upload
    # NOTE: As implemented, we're merely re-refreshing the results, not completely deleting
    # them. So as a recursor to using this route:
    # 1. The relevant results must be unlocked
    # 2. A valid startlist for the round must exist
    post '/file' do
      return 501 unless params[:file]

      data = params[:file][:tempfile].read
      list = JSON.parse(data, symbolize_names: true)
      # TODO: Using a temporary table is likely to be more efficient than the iterative
      # update here, but as this method is rarely used, we can probably leaev this for now
      DB.transaction do
        list.each do |result|
          LocalDBConnection::Results.reset(result)
          LocalDBConnection::Results.update_single!(result)
        end
      end
      [200, { body: list }.to_json]
    rescue StandardError => e
      [500, { body: e.message }.to_json]
    end

    # Delete any results in the broadcast pipeline
    # delete '/broadcast' do
    #   ResultsHandler.purge_eventstream ? 200 : 501
    # end
  end
end
