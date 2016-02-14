# Handlers for '/startlist' routes 
#

module Perseus
  class StartlistController < ApplicationController
  
    # Delete one or more competitors
    #
    def delete_competitors params
      # Guard against (accidental) inputs that would result in bulk deletions...
      # i.e. if no comp/route/group is specified
      params[:wet_id] = params[:wet_id] || 0
      params[:grp_id] = params[:grp_id] || 0
      params[:route]  = params[:route]  || 4
      
      DB[:Results]
        .where(params)
        .delete
    end

    def insert_quali_list params
      delete_competitors(params)
      # TODO
      # Add logic...
      # Here we probably need to put an automatic allocation of group depending upon the 
      # climber's gender and age... 
    end
    
    # Required params are wet_id, grp_id, route, next_route, quota
    #
    def insert_final_list params
      next_route = params.delete(:next_route)
      quota      = params.delete(:quota)

      # Query the database to get the list of qualified climbers
      dataset = DB[:Ranking]
        .select(:per_id, :result_rank)
        .where(params)
        .where(result_rank: 1..quota)
        .reverse_order(:result_rank)
        .all
      
      # Delete any pre-existing startlist
      params[:route] = next_route
      delete_competitors(params)
      
      # Create a new startlist from an ordered array
      dataset.each.with_index(1) do |person, i|
        person.merge!(params)
        person[:start_order]    = i
        person[:rank_prev_heat] = person.delete(:result_rank)
        DB[:Results].insert(person)
      end
    end
  
    # Route handling
    #    
    post '/' do
      hash = Hash[params.map{ |(k,v)| [k.to_sym,v.to_i] }]
      insert_final_list hash
      200
    end
  
  end
end

