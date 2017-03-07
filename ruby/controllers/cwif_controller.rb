# Module  Perseus             - The namespace for all application code
# Class   CWIFController      - Subclasses ApplicationController
#
# CWIFController manages routes specific for the CWIF qulaification format
# Currently implements:
# - A specific qualification round results entry sheet
# - A specific qualification round results display
#
module Perseus
  class CWIFController < Perseus::ApplicationController
    # ROUTES
    # Serve a results input input sheet for CWIF qualification
    #
    get '/results' do
      haml :cwif_results
    end

    # Serve a results display for CWIF qualification
    #
    get '/display' do
      haml :cwif_display
    end
  end
end
