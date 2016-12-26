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
    
    # Route handling
    #
    get '/' do
      haml :registration
    end

    post '/ifsc' do
      args = defaults.merge Hash[params.map{ |(k,v)| [k.to_sym,v.to_i] }]
      data = EGroupwarePublicAPI.get_starters(args[:wet_id])
      
      LANStorageAPI.insert_registrants(data)
    end
  end
end
