# Module  Perseus                 - The namespace for all application code
# Class   StartlistController     - Subclasses ApplicationController
#
# StartlistController manages interactions creating/updating/deleting startlist data
# Currently implements:
# - A Setter to import a new startlist from a formatted UTF-8 CSV file
# - A Setter creating a new startlist from the results of a previous round (CWIF scramble format)
# - A Setter creating a new startlist from the results of a previous round (IFSC format)
#

module Perseus
  class StartlistController < Perseus::ApplicationController
  
    defaults = { wet_id: 0, route: 0, grp_id: 0 }
    
    # HELPERS
    helpers Perseus::EGroupwarePublicAPI
    helpers Perseus::LANStorageAPI
    helpers Perseus::CSVParser

    # Create a startlist from a CSV formatted file
    # Assume that the CSV file contains the following data:
    # per_id, start_order
    # Thie method assumes that wet_id, grp_id and route parameters are also provided
    # which are merged into the default object and passed to the create_startlist method
    #
    post '/file' do
      data = CSVParser.parse_csv_file({ file: params.delete("file") })
      args = defaults.merge Hash[params.map{ |(k,v)| [k.to_sym,v] }]
      
      LANStorageAPI.insert_startlist(args[:wet_id], args[:grp_id], args[:route], data)
    end
    
    # Create a startlist from existing results
    # Expects as a minimum the 
    post '/ifsc' do
      args = defaults.merge Hash[params.map{ |(k,v)| [k.to_sym,v.to_i] }]
      data = EGroupwarePublicAPI.get_results(args[:wet_id], args[:grp_id], args[:route])
      
      LANStorageAPI.insert_startlist(args[:wet_id], args[:grp_id], args[:route], data)
    end
  end
end
