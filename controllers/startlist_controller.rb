# Module  Perseus                 - The namespace for all application code
# Class   StartlistController     - Subclasses ApplicationController
#
# StartlistController manages interactions creating/updating/deleting startlist data
# Currently implements:
# - A Setter to import a new startlist from a formatted UTF-8 CSV file
# - A Setter creating a new startlist from the results of a previous round (CWIF scramble format)
# - A Setter creating a new startlist from the results of a previous round (IFSC format)
#

module Perseus
  class StartlistController < Perseus::ApplicationController
    # HELPERS
    helpers Perseus::EGroupwarePublicAPI
    helpers Perseus::CSVParser

    # symbolize route parameters (deliberately non-recursive)
    before do
      params.keys.each { |k| params[k.to_sym] = params.delete(k) }
    end

    # ROUTES
    #
    # Create a startlist from the results of the current round
    # TODO: Re-architect this as it has to be able to deal with:
    # - 2 start groups,
    # - Importing list of starters from eGroupware (see RegistrationController, which at the moment
    #   simply checks that the relevant peopple are in the database
    # @params = { wet_id: int, grp_id: int, route: int }
    #
    post '/new' do
      # Perseus::LocalDBConnection::Startlist.generate(params) ? 200 : 501
    end

    # Import a startlist for some given competition/category/round from eGroupware
    # @params = { wet_id: int, grp_id: int, route: int }
    post '/ifsc' do
      # NOTE: Deactiviate eGroupware interface
      # params[:competitors] = Perseus::EGroupwarePublicAPI.get_results(params)
      # Perseus::LocalDBConnection::Startlist.insert(params) ? 200 : 501
      501
    end

    post '/json' do
      # data = JSON.parse(params[:data], symbolize_names: true)
      # Perseus::LocalDBConnection::Startlist.insert(data) ? 200 : 501
    end

    # Receive a json-encoded list of climbers and insert_or_ignore into the database
    post '/file' do
      return 501 unless params[:file]

      data   = params[:file][:tempfile]
      hash   = JSON.parse(data.read, symbolize_names: true)
      round  = hash.slice(:wet_id, :route, :grp_id)
      starts = hash[:starters]
               .map { _1.slice(:per_id, :start_order, :rank_prev_heat).merge(round) }
      # TODO: Comment out the database connection until we've checked the client-side code
      #       The connection works for properly formatted JSON data inserted via curl
      # Perseus::LocalDBConnection::Startlist.insert(starts) ? 200 : 501
      # TEST RESPONSE
      [200, { body: starts }.to_json]
    rescue StandardError
      501
    end
  end
end

# Create a startlist from a CSV formatted file
# @params = { wet_id: int, grp_id: int, route: int }
# Assume that the CSV file contains the following data:
# - [wet_id,] [grp_id,] [route,] per_id, start_order, [rank_prev_heat]
#
# NOTE: The order of parameters is unimportant, but the CSV file MUST contain a header
# line
# post '/file' do
#   params[:competitors] = Perseus::CSVParser.parse_csv_file(file: params.delete(:file))
#   # Perseus::LocalDBConnection::Startlist.insert(params) ? 200 : 501
# end
