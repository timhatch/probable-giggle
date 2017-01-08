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

    # symbolize route paramaters (deliberately non-recursive)
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
      ResultsHandler.handle_result_single(params) ? 200 : 501
    end

    # Serve a data input sheet formatted for a Nexus Tablet, IFSC scoring format
    get '/mobile' do
      # OPTION A - Add the wet_id is passed to the params hash (must be named "params")
      params[:wet_id] = LocalDBConnection::Session.data[:wet_id]
      haml :nexus, locals: params
      # OPTION B - Define an instance variable and replace "#{params[:wet_id]}" by
      # "#{@comptetition}"
      # @competition = LocalDBConnection::Session.data[:wet_id]
      # haml :nexus
    end
  end
end
