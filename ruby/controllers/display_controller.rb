# Module  Perseus                 - The namespace for all application code
# Class   DisplayController       - Subclasses ApplicationController
# 
# DisplayController manages interactions between the results database and results displays 
# Currently implements: 
# - An interface to a legacy display originally developed for the CONTEST format of the CWIF, q.v.

#
# TODO: Consider the architectural issues around this class 
# - should all results fetching be done from this class?, 
#
module Perseus
  class DisplayController < Perseus::ApplicationController
 
    # Interface to the "legacy" eGroupware display. Some minor modifications have been made to
    # the egroupware display to get this to run - we can reverse those out however
    #
    get '/egw' do
      redirect '/ifsc_display/index.boulder.html'
    end
  end
end
