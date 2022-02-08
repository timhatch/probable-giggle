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
      Perseus::LocalDBConnection::Startlist.generate(params) ? 200 : 501
    end

    # Import a startlist for some given competition/category/round from eGroupware
    # @params = { wet_id: int, grp_id: int, route: int }
    post '/ifsc' do
    # NOTE: Deactiviate eGroupware interface
    #   params[:competitors] = Perseus::EGroupwarePublicAPI.get_results(params)
    #   Perseus::LocalDBConnection::Startlist.insert(params) ? 200 : 501
      501
    end

    post '/json' do
      data = JSON.parse(params[:data], symbolize_names: true)
      Perseus::LocalDBConnection::Startlist.insert(data) ? 200 : 501
    end

    post '/file' do
      if params[:file]
        # filename = params[:file][:filename]
        data = params[:file][:tempfile]
        return [200, { body: data.read}.to_json]

      end
      501
    end

    # Receive a json-encoded list of climbers and insert_or_ignore into the database
    # @params
    # - data: a json encoded array of climber objects
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
