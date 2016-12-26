# Module  Perseus                 - The namespace for all application code
# Class   RegistrationController  - Subclasses ApplicationController
#
# RegistrationController manages interactions between the results database and results displays
# Currently implements:
# - An interface to a legacy display originally developed for the CONTEST format of the CWIF, q.v.
# - An interface to *load* the results display developed for the IFSC. Results updates are done by
#   calling ResultsController.
#

module Perseus
  class RegistrationController < Perseus::ApplicationController

    defaults = { wet_id: 0, grp_id: 0 }
    
    # HELPERS
    helpers Perseus::EGroupwarePublicAPI
    helpers Perseus::LANStorageAPI
    helpers Perseus::CSVParser

    # Route handling
    #
    get '/' do
      haml :registration
    end

    # Create a startlist from a CSV formatted file
    # Assume that the CSV file contains the following data:
    # per_id, start_order
    # Thie method assumes that wet_id, grp_id and route parameters are also provided
    # which are merged into the default object and passed to the create_startlist method
    #
    post '/file' do
      data = CSVParser.parse_csv_file({ file: params.delete("file") })
      
      LANStorageAPI.insert_registrants(data)
    end
    
    post '/ifsc' do
      args = defaults.merge Hash[params.map{ |(k,v)| [k.to_sym,v.to_i] }]
      data = EGroupwarePublicAPI.get_starters(args[:wet_id])
      
      LANStorageAPI.insert_registrants(data)
    end
  end
end
