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


params = {wet_id: 1, route: 2, grp_id: 5, per_id: 201632, start_order: 16, rank_prev_heat: 16}

#DB[:Results].insert(params)
DB[:Results]
.where(per_id: 201632)
.update({per_id: 2016032})



#
# MAIN
#


#p  JSON.parse(DB[:Competitions].first[:format])[index.to_s]

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