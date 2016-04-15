# Test Sequel / PostgresSQL
Dir.chdir("/users/timhatch/sites/flashresults/ruby")

require 'json'
require 'pg'
require 'sequel'
require 'csv'

#
# address format for a non-passwork protected BD "postgres://[user]@localhost:5432/[name]"
# address format for a passwork protected BD "postgres://[user][:password]@localhost:5432/[name]"
#

#ENV['DATABASE_URL'] = "postgres://postgres@localhost:5432/test"
#ENV['DATABASE_URL'] = "postgres://postgres@melody.local:5432/test"

DB = Sequel.connect(ENV['DATABASE_URL'] || "postgres://timhatch@localhost:5432/test")
DB.extension :pg_array      # Needed to insert arrays
Sequel.extension :pg_array_ops  # Needed to query stored arrays


params = {wet_id: 2, route: 1, grp_id: 5 }

# USE A FILTER TO SCREEN OUT JUNIOES (CWIF)

# date = Sequel.cast(Date.today,DateTime)
# year = Sequel.extract(:year, date).cast(Integer)
year    = Sequel.cast(Date.today, DateTime).extract(:year).cast(Integer)
juniors = DB[:Climbers].where{birthyear > year - 19}


# TEST IFSC SORTING AND CWIF QUALIFICATION SORTING
#
module IFSCResultsModus
  module_function
  def result_generator
    t  = Sequel.pg_array_op(:sort_values)[1].cast(:text) 
    ta = Sequel.pg_array_op(:sort_values)[2].cast(:text)
    b  = Sequel.pg_array_op(:sort_values)[3].cast(:text) 
    ba = Sequel.pg_array_op(:sort_values)[4].cast(:text)
    str =  t + "t" + ta + " " + b + "b" + ba 
  end
  def rank_generator 
  [
    Sequel.pg_array_op(:sort_values)[1].desc,
    Sequel.pg_array_op(:sort_values)[2],
    Sequel.pg_array_op(:sort_values)[3].desc,
    Sequel.pg_array_op(:sort_values)[4]
  ]
  end
end

module CWIFResultsModus
module_function
#  def result_generator
#    t  = Sequel.pg_array_op(:sort_values)[1] * 13
#    ta = Sequel.pg_array_op(:sort_values)[2] * 3
#    b  = Sequel.pg_array_op(:sort_values)[3].cast(:text) 
#    
#    Sequel.cast(t - ta, :text) + "b" + b 
#  end
def rank_generator
  t  = Sequel.pg_array_op(:sort_values)[1] * 13
  ta = Sequel.pg_array_op(:sort_values)[2] * 3
  b  = Sequel.pg_array_op(:sort_values)[3]
  
  [(t - ta).desc, b.desc]
end    
end
# NOTE
# Test passing in a reference to a ranking method, to replace
# StartlistController::create_from_cwif_results() and
# StartlistController::create_from_ifsc_results()
# by a single function
class TestController  
  def get_results params, rank_calculator
    who = :Climbers
    
    DB[:Results]
      .where(params)
      .select(:wet_id, :grp_id, :route)
      .select_append(:result_json, :rank_prev_heat, :start_order, :sort_values)
      .select_append{rank.function.over(order: rank_calculator).as(:result_rank)}
      .join(who, :per_id => :per_id)
      .order(:start_order)
      .limit(10)
      .all
  end
end

hash_reference = { :method => :CWIFResultsModus }
mod    = hash_reference[:method]
p mod.class
mod    = CWIFResultsModus 
method = mod.rank_generator

instance = TestController.new
p instance.get_results params, method


#  .select_append(:Results__per_id, :lastname, :firstname, :nation, :birthyear)

#row[:sort_values]
#RB = Sequel.connect("postgres://postgres@melody.local:5432/postgres@melody.local/test")
#RB = Sequel.connect("postgres://postgres@melody.local:5432/test")

#p RB.drop_table(:Params)

