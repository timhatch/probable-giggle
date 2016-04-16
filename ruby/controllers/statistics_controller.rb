# Module  Perseus                 - The namespace for all application code
# Class   StatisticsController    - Subclasses ApplicationController
# 
# StatisticsController manages routes interrogating the results database and generating
# statistics on the results...
# Currently implements: 
# - Getting a summary of tops/bonuses/attempts for aach boulder in a round
# - Forecasting the highest/loeest rank that a competitor can in theory achieve
# - Getting multiple results (e.g. for a climber, or for all climbers in a round) 
# - Getting s list of competitors who have topped/bonuses any specified boulder in the 
#   round
#
require_relative './application_controller.rb'

module Perseus
  class StatisticsController < Perseus::ApplicationController

    # HELPERS
    helpers Perseus::IFSCResultsModus

    def forecast_best_result results, b_number
      results.map do |result|
        # TODO: b_completed as currently defined simply picks up how many boulders have 
        # been attempted, but it presumes that 
        b_completed  = JSON.parse(result.delete(:result_json)).length
        forecast_best = Array.new(4, b_number - b_completed)
        forecast_best.map.with_index { |x,i| forecast_best[i] += result[:sort_values][i] }
    
        result[:result_min] = result.delete(:sort_values)
        result.merge({ result_max: forecast_best })
      end
    end

    # Calculate in/post round rankings using the IFSC ranking algorithm
    # 
    def forecast_ifsc_ranking
      DB[:Forecast]
      .select(:start_order, :sort_values, :rank_prev_heat)
      .select_more{rank.function
      .over(order: Perseus::IFSCResultsModus.rank_generator
      )}
      .all
    end

    # Set or reset the sort_values in the sorting table
    def set_sort_values starter, result
      DB[:Forecast]
      .where(start_order: starter)
      .update(sort_values: Sequel.pg_array(result))
    end

    def forecast_results results, test_key, base_key
      # Figure out whether we're calculating the highest or lowest achieveable rankings
      param = (test_key === :result_min) ? :rank_min : :rank_max
      # Set the sort values
      results.each { |result| set_sort_values(result[:start_order], result[base_key]) }

      # For each result, insert the "test" result in the sorting database, 
      # generate a ranking forecast, storing that ranking in the result, and then 
      # re-set the sorting database before proceeding to the next result
      results.each do |result|
        set_sort_values(result[:start_order], result[test_key])
  
        result[param] = forecast_ifsc_ranking
                        .select { |a| a[:start_order] == result[:start_order] }
                        .first[:rank]
  
        set_sort_values(result[:start_order], result[base_key])
      end
    end
    
    # Helper function to create a regex for a given data type ("type"), e.g. "a", "b" or "t" 
    # returns a lambda function with the boulder "x" as an input parameter...
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

    # Get a a summaery of results for all boulders in a round
    # required params: wet_id, route 
    # optional params: grp_id, data="a"|"b"|"t" 
    #
    get '/round' do
      hash       = Hash[params.map{ |(k,v)| [k.to_sym,v] }]
      type_regex = generate_regex(hash.delete(:data) || "t")
      index      = hash[:route] || 0
      
      #
      # TODO: Change this at is picking up a fixed competition not necessarily the one we're interested in...
      #
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
    
    # "Forecast" results for all climbers en-route
    # required params: wet_id, route, grp_id
    #
    get '/forecast' do
      hash       = Hash[params.map{ |(k,v)| [k.to_sym,v] }]
      index      = hash[:route] || 0
      n_boulders = JSON.parse(DB[:Competitions].first[:format])[index.to_s]
    
      dataset = DB[:Ranking]
        .select(:lastname, :firstname, :start_order, :sort_values, :rank_prev_heat, :result_json)
        .select_append(Sequel.as(:result_rank, :rank_now))
        .where(hash)
        .exclude(sort_values: nil)
    
      # Insert the default ranking data into
      DB.create_table! :Forecast, { as: dataset, temp: true }
  
      forecast_data =  forecast_best_result(dataset.all, n_boulders)
      forecast_results(forecast_data, :result_max, :result_min)
      forecast_results(forecast_data, :result_min, :result_max)
    
      forecast_data.to_json
    end
  end
end