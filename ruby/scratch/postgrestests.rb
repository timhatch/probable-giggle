require 'sequel'
require 'pg'
require 'json'

# Use a lambda instead of a function
def gen_attempts type
  regex    = Regexp.new "#{type}([0-9]{1,})"
  lambda do |result|
    matched = regex.match result
    matched.captures.to_a.first.to_i unless matched.nil?
  end
end

#tops = gen_attempts "t"
#p tops["a3b1t3"]


# TEST PG_ARRAY AND PG_JSON EXTENSIONS FOR SEQUEL 
# 
#
DB = Sequel.connect(ENV['DATABASE_URL'] || "postgres://timhatch@localhost:5432/test")
DB.extension :pg_array, :pg_json
Sequel.extension :pg_array_ops
Sequel.extension :pg_json

# TEST JOINING TWO TABLES VIA A COMMON PARAMETER
# Get some test data
dataset = DB[:Results].join(:Climbers, [:per_id]).where({per_id: 1030})
#p dataset.first

# COPY A JSON OBJECT STORED AS A STRING ACROSS INTO A JSONB COLUMN
# Copy all strongified results from result_json into result_jsonb as actual json objects
# dataset = DB[:Results]
# dataset.each do |item|
#   id   = item[:per_id]
#   hash = JSON.parse item[:result_json]
# 
#   dataset.where({ per_id: id }).update({ result_jsonb: Sequel.pg_jsonb(hash) })
# end


#THREE METHODS FOR ORDERING IN SEQUEL
#  p DB[:Forecast]
#  .select(:start_order, :sort_values, :rank_prev_heat)
#  .reverse(Sequel.pg_array_op(:sort_values)[1])
#  .order_more(Sequel.pg_array_op(:sort_values)[2]).reverse
#  .order_more(Sequel.pg_array_op(:sort_values)[3]).reverse
#  .order_more([Sequel.pg_array_op(:sort_values)[4], :rank_prev_heat])
#  .all
# # Reset the data ahead of the next comparison 
#
#  p DB[:Forecast]
#  .select(:start_order, :sort_values, :rank_prev_heat)
#  .order(Sequel.desc(Sequel.pg_array_op(:sort_values)[1]))
#  .order_more(Sequel.asc(Sequel.pg_array_op(:sort_values)[2]))
#  .order_more(Sequel.desc(Sequel.pg_array_op(:sort_values)[3]))
#  .order_more(Sequel.asc(Sequel.pg_array_op(:sort_values)[4]))
#  .order_more(Sequel.asc(:rank_prev_heat))
#  .all
#
#  DB[:Forecast]
#  .select(:start_order, :sort_values, :rank_prev_heat)
#  .order(
#    Sequel.desc(Sequel.pg_array_op(:sort_values)[1]),
#    Sequel.asc(Sequel.pg_array_op(:sort_values)[2]),
#    Sequel.desc(Sequel.pg_array_op(:sort_values)[3]),
#    Sequel.asc(Sequel.pg_array_op(:sort_values)[4]),
#    Sequel.asc(:rank_prev_heat)
#  )
#  .all
