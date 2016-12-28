# Module  Perseus                 - The namespace for all application code
# Class   RegistrationController  - Subclasses ApplicationController
#
# RegistrationController manages the addition of new competitor information to the LAN database
# Currently implements:
# - A route (registration/file) to upload competitor data from a CSV file
# - A route (registration/ifsc) to fetch competitor data from the list of climbers registered
#   for a specific competition within eGroupware 
#

module Perseus
  class RegistrationController < Perseus::ApplicationController

    # HELPERS
    helpers Perseus::EGroupwarePublicAPI
    helpers Perseus::LANStorageAPI
    helpers Perseus::CSVParser

    # symbolize route paramaters (deliberately non-recursive)
    #
    before do
      params.keys.each{ |k| params[k.to_sym] = params.delete(k) }
    end
    
    # Route handling
    #
    # Add to the list of registered climbers by reading from a CSV formatted file
    # Assume that the CSV file contains the following data:
    # per_id, lastname, firstname, club (federation), nation, birthyear
    # @params
    # - a csv file
    #
    post '/file' do
      data = CSVParser.parse_csv_file({ file: params.delete(:file) })
      LANStorageAPI.insert_registrants(data) ? 200 : 501
    end
    
    # Fetch a list of climbers from eGroupware (actually fetches the list of climbers registered
    # for a specific competition.
    # @params
    # - wet_id
    # This method simply passes the require parameters to the EGroupwarePublicAPI.get_starters where
    # they are checked.
    #
    post '/ifsc' do
      data = EGroupwarePublicAPI.get_starters(params)
      LANStorageAPI.insert_registrants(data) ? 200 : 501
    end
  end
end
