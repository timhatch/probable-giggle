# Handlers for '/statistics' routes 
#

module Perseus
  class StatisticsController < ApplicationController

    # Helper function to create a regex for a given data type ("type") and boulder (x)
    # returns a lambda function
    #
    def generate_regex type
      lambda do |x|
        { 
          "a" => /\"p#{x}\":\"a/,
          "b" => /\"p#{x}\":\"a[0-9]{1,}b/,
          "t" => /\"p#{x}\":\"a[0-9]{1,}b[0-9]{1,}t/
        }[type]
      end
    end
    
    # Get a a summaery of results for all boulders in a round
    # required params: wet_id, route 
    # optional params: grp_id, data="a"|"b"|"t" 
    #
    get '/round' do
      hash       = Hash[params.map{ |(k,v)| [k.to_sym,v] }]
      type_regex = generate_regex(hash.delete(:data) || "t")
      index      = hash[:route] || 0
      n_boulders = JSON.parse(DB[:Competitions].first[:format])[index.to_s]

      # Interrogate the database
      result = Hash.new
      DB.transaction do
        (1..n_boulders).each do |bloc_n|
          result["p#{bloc_n}"] = DB[:Results]
            .where(hash)
            .where(Sequel.like(:result_json, type_regex[bloc_n]))
            .count
        end    
      end
      result.to_json
    end
    
    # Get a list of (the first 30) climbers who have attempted/completed a defined boulder
    # required params: wet_id, route, boulder
    # optional params: grp_id, data="a"|"b"|"t"
    #
    get '/boulder'  do
      hash       = Hash[params.map{ |(k,v)| [k.to_sym,v] }]
      type_regex = generate_regex(hash.delete(:data) || "t")
      bloc_n     = hash.delete(:boulder) || 1
      
      DB[:Results]
        .where(hash)
        .where(Sequel.like(:result_json, type_regex[bloc_n]))
        .join(:Climbers, :per_id => :Results__per_id)
        .select(:Climbers__lastname, :Climbers__firstname)
        .limit(30)
        .all
        .to_json
    end
    
  end
end