require 'sequel'
require 'pg'
require 'json'

# Interrogate a hash 
def get_attempts type, result, arr
  regex   = Regexp.new "#{type}([0-9]{1,})"
  matched = regex.match(result)
  if matched
    arr[0] += 1
    arr[1] += matched.captures.to_a.first.to_i
  end
end

#res = "a2b1t2"
#arr = [0,0]
#p get_attempts("t", res, arr)  

# Use a lambda instead of a function
def gen_attempts type
  regex    = Regexp.new "#{type}([0-9]{1,})"
  lambda do |result|
    matched = regex.match result
    matched.captures.to_a.first.to_i unless matched.nil?
  end
end

tops = gen_attempts "t"
#p tops["a3b1t3"]

def set_overall result_json
  tarr = [0,0]
  barr = [0,0]
  result_json.each do |key,value|
    get_attempts "t", value, tarr
    get_attempts "b", value, bar
  end
  tarr + barr
end

#obj = { "p2" => "a3b2", "p1" => "a4b2t4" }
#resArray = set_overall obj

DB = Sequel.connect(ENV['DATABASE_URL'] || "postgres://timhatch@localhost:5432/test")
DB.extension :pg_array, :pg_json
Sequel.extension :pg_array_ops  # Needed to query stored arrays?
Sequel.extension :pg_json


#dataset = DB[:Results]
#  .where({wet_id: 99, per_id: 1030, route: 1})

#p JSON.parse dataset.first[:result_json]

#testhash = { title: { a: 1, b: 1, t: 1 } }
#p testhash
#testjson = testhash.to_json
#p testjson

#dataset = DB[:books]
#  .where({id: 1})
#  .update({
#    datab: Sequel.pg_jsonb(testhash)
#  })

# Copy all strongified results from result_json into result_jsonb as actual json objects
dataset = DB[:Results]#.where({per_id: 1030})

dataset.each do |item|
  id   = item[:per_id]
  hash = JSON.parse item[:result_json]

  dataset.where({ per_id: id }).update({ result_jsonb: Sequel.pg_jsonb(hash) })
end



#dataset.update(result: "4t4 4b4")
#pg_arr = Sequel.pg_array(resArray)
#dataset.update(sort_values: Sequel.pg_array(resArray))

# def update_result arr
#   arr[0].to_s << 't' << arr[1].to_s << ' ' << arr[2].to_s << 'b' << arr[3].to_s
# end

#arr = [1,2,3,3]
#p update_result arr
#def gen_times factor

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
