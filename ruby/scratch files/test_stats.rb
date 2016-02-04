# Test Sequel / PostgresSQL
Dir.chdir("/users/timhatch/sites/flashresults/ruby")

require 'json'
require 'pg'
require 'sequel'

#
# address format for a non-passwork protected BD "postgres://[user]@localhost:5432/[name]"
# address format for a passwork protected BD "postgres://[user][:password]@localhost:5432/[name]"
#
DB = Sequel.connect(ENV['DATABASE_URL'] || "postgres://timhatch@localhost:5432/test")
DB.extension :pg_array      # Needed to insert arrays
Sequel.extension :pg_array_ops  # Needed to query stored arrays

#
# HELPERS
#
def forecast_best_result results, b_number
  results.map do |result|
    b_completed  = JSON.parse(result.delete(:result_json)).length
    forecast_best_result = Array.new(4, b_number - b_completed)
    forecast_best_result.map.with_index { |x,i| forecast_best_result[i] += result[:sort_values][i] }
    
    result[:result_min] = result.delete(:sort_values)
    result.merge({ result_max: forecast_best_result })
  end
end

# Calculate in/post round rankings using the IFSC ranking algorithm
# 
def forecast_ifsc_ranking
  DB[:Forecast]
  .select(:start_order, :sort_values, :rank_prev_heat)
  .select_more{rank.function
  .over(order: [
    Sequel.desc(Sequel.pg_array_op(:sort_values)[1]),
    Sequel.pg_array_op(:sort_values)[2],
    Sequel.desc(Sequel.pg_array_op(:sort_values)[3]),
    Sequel.pg_array_op(:sort_values)[3],
    :rank_prev_heat
  ])}
  .all
end

# Set or reset the sort_values in the sorting table
def forecast_set_sort_values starter, result
  DB[:Forecast]
  .where(start_order: starter)
  .update(sort_values: Sequel.pg_array(result))
end

def forecast_results results, test_key, base_key
  # Figure out whether we're calculating the highest or lowest achieveable rankings
  param = (test_key === :result_min) ? :rank_min : :rank_max
  # Set the sort values
  results.each { |result| forecast_set_sort_values(result[:start_order], result[base_key]) }

  # For each result, insert the "test" result in the sorting database, 
  # generate a ranking forecast, storing that ranking in the result, and then 
  # re-set the sorting database before proceeding to the next result
  results.each do |result|
    forecast_set_sort_values(result[:start_order], result[test_key])
  
    result[param] = forecast_ifsc_ranking
                    .select { |a| a[:start_order] == result[:start_order] }
                    .first[:rank]
  
    forecast_set_sort_values(result[:start_order], result[base_key])
  end
end

#
# MAIN
#

params = { wet_id: 1584, route: 3, grp_id: 5 }
# Fetch the default Ranking data
# NOTE Can remove :per_id as it is used here only for debugging (or replace :start_order)
def forecast params
  b_number = 4
  dataset = DB[:Ranking]
  .select(:lastname, :firstname, :start_order, :sort_values, :rank_prev_heat, :result_json)
  .select_append(Sequel.as(:result_rank, :rank_now))
  .where(params)
  .exclude(sort_values: nil)
    
  # Insert the default ranking data into
  DB.create_table! :Forecast, { as: dataset, temp: true }
  
  results_data =  forecast_best_result(dataset.all, b_number)
#  results_data.each { |r| r[:result_min] = r.delete(:sort_values) }

  forecast_results(results_data, :result_max, :result_min)
  forecast_results(results_data, :result_min, :result_max)
    
  results_data.to_json
end

#p forecast params

p  JSON.parse(DB[:Competitions].first[:format])[index.to_s]

# Get ranking data by operating on a pre-ranked view
def test_view params
  DB[:Ranking]
    .where(params)
    .select(:PerId,:lastname,:firstname,:nation,:result_rank,:result,:result_json,:rank_prev_heat)
    .all
end

def create_uuid params
  ruid = {}
  if params.has_key?(:wet_id) then ruid[:wet_id] = params.delete(:wet_id) end
  if params.has_key?(:grp_id) then ruid[:grp_id] = params.delete(:grp_id) end
  if params.has_key?(:route) then ruid[:route] = params.delete(:route) end
  ruid
end
  
# Get ranking data by calling a window funtion
def test_window params
  round   = create_uuid params
  dataset = DB[:Ranking]
    .where(round)
    .select(:wet_id, :grp_id, :route, :lastname)
    .select_append{rank.function.over(
      :partition => [:wet_id, :grp_id, :route],
      :order => [
        Sequel.desc(:rank_param), 
        Sequel.asc(:rank_prev_heat)
      ])
      .as(:result_rank)
    }
  dataset.where(params).all
end