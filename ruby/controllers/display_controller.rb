# Module  Perseus                 - The namespace for all application code
# Class   DisplayController       - Subclasses ApplicationController
#
# DisplayController manages interactions between the results database and results displays
# Currently implements:
# - An interface to the IFSC format display.

#
# TODO: Consider the architectural issues around this class
# - should all results fetching be done from this class?,
#
module Perseus
  class DisplayController < Perseus::ApplicationController
    # Interface to the "legacy" eGroupware display.
    # Some minor modifications have been made to the egroupware display to get this to run
    get '/egw' do
      puts params
      haml :ifsc_display, locals: params
    end

    get '/stream' do
      haml :streaming_client
    end
  end
end
