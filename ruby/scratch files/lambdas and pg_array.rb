require 'sequel'
require 'pg'
#require 'json'

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
#def gen_attempts type
#  regex    = Regexp.new "#{type}([0-9]{1,})"
#  lambda do |result|
#    matched = regex.match result
#    matched.captures.to_a.first.to_i unless matched.nil?
#  end
#end
#
#tops = gen_attempts "t"
#p tops["a3b1t3"]

def set_overall result_json
  tarr = [0,0]; barr = [0,0]
  result_json.each do |key,value|
    get_attempts "t", value, tarr
    get_attempts "b", value, barr
  end
  tarr + barr
end

obj = { "p2" => "a3b2", "p1" => "a4b2t4" }
resArray = set_overall obj

DB = Sequel.connect(ENV['DATABASE_URL'] || "postgres://timhatch@localhost:5432/test")
DB.extension :pg_array

dataset = DB[:Results]
  .where({per_id: 1030, route: 2})

p dataset.first

dataset.update(result: "4t4 4b4")
pg_arr = Sequel.pg_array(resArray)
#dataset.update(sort_values: Sequel.pg_array(resArray))

def update_result arr
  arr[0].to_s << 't' << arr[1].to_s << ' ' << arr[2].to_s << 'b' << arr[3].to_s
end

arr = [1,2,3,3]
p update_result arr
#def gen_times factor
#  return Proc.new { |n| n*factor }
#end
#
#times3 = gen_times(3)
#
#p times3.call(5)
#p times3[5]

#def gen_times factor
#  lambda { |n| return n * factor }
#end
#
#times4 = gen_times(4)
#p times4[5]

