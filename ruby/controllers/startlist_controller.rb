# Handlers for '/startlist' routes 
#

require 'csv'

module Perseus
  class StartlistController < ApplicationController
  
    defaults = { wet_id: 0, route: 0, grp_id: 0, quota: 1 }
    
    # HELPERS
    helpers Perseus::CWIFResultsModus
    helpers Perseus::IFSCResultsModus

    # Move to the next round, delete any existing startlist and [re-]create
    def create_startlist params, dataset
      DB[:Results].where(params).delete
      dataset.each.with_index(1) do |person, i|
        person.merge!(params)
        person[:start_order] ||= i
        DB[:Results].insert(person)
      end      
    end      
    
    # 
    # @params: wet_id, grp_id, route, quota
    #
    def create_from_cwif_results params
      quota = params.delete(:quota)
      
      # Fetch the results of the previous round
      dataset = DB[:Results]
      .where(params)
      .select(:per_id)
      .select_append{
        rank.function.over(order: CWIFResultsModus.rank_generator)
        .as(:rank_prev_heat)}
      .reverse_order(:rank_prev_heat)
      .all
      
      # Apply the quota and call the create_startlist method 
      dataset.keep_if { |row| row[:rank_prev_heat] <= quota }
      params[:route] += 1
      create_startlist(params, dataset)
    end
    
    def create_from_ifsc_results params
      quota = params.delete(:quota)
      
      # Fetch the results of the previous round
      dataset = DB[:Results]
      .where(params)
      .select(:per_id)
      .select_append{
        rank.function.over(order: IFSCResultsModus.rank_generator)
        .as(:rank_prev_heat)}
      .reverse_order(:rank_prev_heat)
      .all
      
      # Apply the quota and call the create_startlist method 
      dataset.keep_if { |row| row[:rank_prev_heat] <= quota }
      params[:route] += 1
      create_startlist(params, dataset)
    end
    
    post '/import' do
    
    end
    
    post '/cwif' do
      args = defaults.merge Hash[params.map{ |(k,v)| [k.to_sym,v.to_i] }]
      create_from_cwif_results(args)
      200
    end
    
    post  '/ifsc' do
      args = defaults.merge Hash[params.map{ |(k,v)| [k.to_sym,v.to_i] }]
      create_from_ifsc_results(args)
      200
    end
      
  end
end