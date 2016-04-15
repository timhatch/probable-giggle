# Module  Perseus                 - The namespace for all application code
# Class   DisplayController       - Subclasses ApplicationController
# 
# DisplayController manages interactions between the results database and results displays 
# Currently implements: 
# - An interface to a legacy display originally developed for the CONTEST format of the CWIF, q.v.
# - An interface to *load* the results display developed for the IFSC. Results updates are done by
#   calling ResultsController.

#
# TODO: Consider the architectural issues around this class 
# - should all results fetching be done from this class?, 
# - should setting/getting results alwat be delegated to the ResultsController class? 
# - Should getting/setting results be put into one or more helper modules
#
module Perseus
  class DisplayController < Perseus::ApplicationController

    # Return a Sequel order query to sort on the basis of points (10/7/4) amd then bonuses 
    # @params - none
    # @returns  - An array containing Sequel parameters used to set the order of rows returned
    # within a Postgres window::rank function call.
    # 
    def self.cwif_rank_generator
      t  = Sequel.pg_array_op(:sort_values)[1] * 13
      ta = Sequel.pg_array_op(:sort_values)[2] * 3
      b  = Sequel.pg_array_op(:sort_values)[3]
    
      [(t - ta).desc(:nulls => :last), b.desc]
    end    
    
    # Interrogate the Results database table, fetching a sorted dataset and then returning a
    # JSON formatted object continaing the parameters expected by the legacy CWIF display
    # @params: "cat" with expected values "m" or "f"
    #
    # NOTE: The .exclude(:sort_values) line has the effect of excluding any competitors who 
    # have no result. However in some instances we want to display all *starters* so the
    # exclude would be inappropriate,an in this case we'd need to figure out either on the client
    # side or here how to allocate a rank (I think the cwif_rank_generator method will fail if 
    # the sort_values field is empty...)
    # Check the IFSC results display code to see how it is handled there
    #
    # TODO: Refactor the CWIF results client code to do away with most or all of this...
    #
    def get_cwif_results params
      cat_ip = params.delete("cat")
      params[:wet_id] = 2
      params[:route]  = 1
      params[:grp_id] = (cat_ip === 'm') ? 6 : 5
      
      # Fetch the relevant results and assign a rank to each 
      data = DB[:Results]
        .where(params)
        .exclude(sort_values: nil)
        .join(:Climbers, :per_id => :per_id)
        .select(:lastname, :firstname, :nation)
        .select_append(:start_order, :sort_values)
        .select_append{rank.function
          .over(order: DisplayController.cwif_rank_generator)
          .as(:rank)}
        .all
      
      # Convert the qurey result into the form assumed by the legacy page 
      data.each do |row|
        row[:id]          = row.delete(:start_order)
        row[:name]        = row.delete(:lastname).to_s << ", " << row.delete(:firstname).to_s
        row[:countrycode] = row.delete(:nation)
        row[:category]    = cat_ip
        row[:points]      = (row[:sort_values][0] * 13) - (row[:sort_values][1] * 3)
        row[:bonus]       = row[:sort_values][2]
        row.delete(:sort_values)
      end
      
      data.to_json  
    end

    # Interface to the "legacy" eGroupware display. Some minor modifications have been made to
    # the egroupware display to get this to run - we can reverse those out however
    #
    get '/egw' do
      redirect '/ifsc_display/index.boulder.html'
    end
    
    # Interface to the "legacy" CWIF Qualification interface. As above
    get '/cwif' do
      redirect '/cwif_display/results.html'
    end
    
    # Instead of fetching results through the ResultsController, do that here (because of the
    # various custom modifications needed to the output JSON format). 
    # Again, we can migrate this in the future...
    #
    # TODO: 
    get '/cwif/results' do
      get_cwif_results(params)
    end
    
  end
end