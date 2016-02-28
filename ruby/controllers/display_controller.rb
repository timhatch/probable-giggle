# Handlers for '/competition' routes 
#

module Perseus
  class DisplayController < ApplicationController

    def self.rank_generator
      t  = Sequel.pg_array_op(:sort_values)[1] * 13
      ta = Sequel.pg_array_op(:sort_values)[2] * 3
      b  = Sequel.pg_array_op(:sort_values)[3]
    
      [(t - ta).desc, b.desc]
    end    
    
    def get_legacy_results params
      cat_ip = params.delete("cat")
      params[:wet_id] = 0
      params[:route]  = 0
      params[:grp_id] = (cat_ip === 'm') ? 6 : 5
      
      # Fetch the relevant results and assign a rank to each 
      data = DB[:Results]
        .where(params)
        .join(:Climbers, :per_id => :per_id)
        .select(:lastname, :firstname, :nation)
        .select_append(:start_order, :sort_values)
        .select_append{rank.function.over(order: DisplayController.rank_generator).as(:rank)}
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

    # EGroupware interface
    get '/egw' do
      redirect '/ifsc_display/index.boulder.html'
    end
    
    # Legacy CWIF Qualification interface
    get '/legacy/m' do
      redirect '/legacy_display/results-m.html'
    end
    
    get '/legacy/f' do
      redirect '/legacy_display/results-f.html'
    end
    
    get '/legacy/results' do
      get_legacy_results(params)
    end
    
  end
end

