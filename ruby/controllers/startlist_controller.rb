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

    # symbolize route paramaters (deliberately non-recursive)
    before do
      params.keys.each { |k| params[k.to_sym] = params.delete(k) }
    end

    # Create a startlist from a CSV formatted file
    # params = { wet_id: 1572, grp_id: 5, route: 2 }
    # Assume that the CSV file contains the following data:
    # - [wet_id,] [grp_id,] [route,] per_id, start_order, [rank_prev_heat]
    # 
    # NOTE: The order of parameters is unimportant, but the CSV file MUST contain a header
    # line
    # REVIEW: This function not yet tested
    post '/file' do
      params[:competitors] = CSVParser.parse_csv_file(file: params.delete(:file))
      LocalDBConnection::Startlist.insert(params) ? 200 : 501
    end

    # Import a startlist for some given competition/category/round from eGroupware
    # params = { wet_id: 1572, grp_id: 5, route: 2 }
    post '/ifsc' do
      params[:competitors] = EGroupwarePublicAPI.get_results(params)
      LocalDBConnection::Startlist.insert(params) ? 200 : 501
    end
  end
end
