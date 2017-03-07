# Module  Perseus                 - The namespace for all application code
# Class   DisplayController       - Subclasses ApplicationController
#
# DisplayController manages interactions between the results database and results displays
# Currently implements:
# - An interface to the IFSC format display & streaming display
# - An interface to a prototype forecast display
#
module Perseus
  class DisplayController < Perseus::ApplicationController
    # ROUTES
    # Serve a launch page for the main desktop and tablet displays
    #
    get '/' do
      haml :displays
    end

    # Serve a live updating forecast SPA. Based on the streaming client
    #
    get '/forecast' do
      haml :forecast
    end
  end
end
