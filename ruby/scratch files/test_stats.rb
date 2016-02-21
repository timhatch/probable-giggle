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
DB = Sequel.connect(ENV['DATABASE_URL'] || "postgres://timhatch@localhost:5432/test")
DB.extension :pg_array      # Needed to insert arrays
Sequel.extension :pg_array_ops  # Needed to query stored arrays


params = {wet_id: 1584, route: 3, grp_id: 5 }

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
  def result_generator
    t  = Sequel.pg_array_op(:sort_values)[1] * 13
    ta = Sequel.pg_array_op(:sort_values)[2] * 3
    b  = Sequel.pg_array_op(:sort_values)[3].cast(:text) 
    
    Sequel.cast(t - ta, :text) + "b" + b 
  end
  def rank_generator
    t  = Sequel.pg_array_op(:sort_values)[1] * 13
    ta = Sequel.pg_array_op(:sort_values)[2] * 3
    b  = Sequel.pg_array_op(:sort_values)[3]
    
    [(t - ta).desc, b.desc]
  end    
end

who = :Climbers
#who = juniors

data = DB[:Results]
  .where(params)
  .select(:wet_id, :grp_id, :route)
  .select_append(:Results__per_id, :lastname, :firstname, :nation, :birthyear)
  .select_append(:result_json, :rank_prev_heat, :start_order, :sort_values)
  .select_append{
    rank.function.over(
    partition: [:wet_id, :grp_id, :route],
    order: IFSCResultsModus.rank_generator)
    .as(:result_rank)}
  .select_append(Sequel.as(IFSCResultsModus.result_generator, :result))
  .join(who, :per_id => :per_id)
  .order(:start_order)
  .all