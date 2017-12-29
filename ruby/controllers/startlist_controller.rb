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
    helpers Perseus::LocalDBConnection
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

    # Create a startlist from a CSV formatted file
    # @params = { wet_id: int, grp_id: int, route: int }
    # Assume that the CSV file contains the following data:
    # - [wet_id,] [grp_id,] [route,] per_id, start_order, [rank_prev_heat]
    #
    # NOTE: The order of parameters is unimportant, but the CSV file MUST contain a header
    # line
    post '/file' do
      params[:competitors] = Perseus::CSVParser.parse_csv_file(file: params.delete(:file))
      Perseus::LocalDBConnection::Startlist.insert(params) ? 200 : 501
    end

    # Import a startlist for some given competition/category/round from eGroupware
    # @params = { wet_id: int, grp_id: int, route: int }
    post '/ifsc' do
      params[:competitors] = Perseus::EGroupwarePublicAPI.get_results(params)
      Perseus::LocalDBConnection::Startlist.insert(params) ? 200 : 501
    end

    # Add to the list of registered climbers by reading from a CSV formatted file
    # Assume that the CSV file contains the following data:
    # per_id, lastname, firstname, club (federation), nation, birthyear
    # @params
    # - a csv file
    # REVIEW: This function not yet tested
    post '/registration/file' do
      data = Perseus::CSVParser.parse_csv_file(file: params.delete(:file))
      Perseus::LocalDBConnection::Competitors.insert(data) ? 200 : 501
    end

    # Fetch a list of climbers from eGroupware (actually fetches the list of climbers registered
    # for a specific competition.
    # @params
    # - wet_id
    # This method simply passes the require parameters to the EGroupwarePublicAPI.get_starters
    # method for validation and action
    post '/registration/ifsc' do
      data = Perseus::EGroupwarePublicAPI.get_starters(params)
      Perseus::LocalDBConnection::Competitors.insert(data) ? 200 : 501
    end
  end
end
