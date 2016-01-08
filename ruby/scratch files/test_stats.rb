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

# Public: Fetch statistics for a given competition/round and category
# 
# params  - A Hash containing (optionally) datatype, WetId, GrpId and route data  
#
# Returns a Hash object
def boulder_data params
  # Set the data type and delete the :data parameter
  data_tp = params[:data] == 'attempts' ? 'a' : 't'
  params.delete :data
  
  # Set the number of blocs to be checked 
  idx     = params[:route] || 0
  str     = DB[:Competitions].select(:format).first[:format]
  bloc_nr = (JSON.parse str)[idx.to_s]
  
  # Interrogate the database
  results = {}
  DB.transaction do
    (1..bloc_nr).each do |x|
      k = ("p#{x}").to_sym
      results[k] = DB[:Results]
        .where(Sequel.like(:result_json, "%p#{x}\":\"#{data_tp}%"))
        .where(params)
        .count
    end    
  end
  results
end
# Test
#params = { data: 'tops', WetId: 1, route: 0, GrpId: 5 }
#p boulder_data params


# Public: Fetch a list of climbers who topped a given boulder
# 
# params  -  A Hash containing (optionally) boulder_id, WetId, GrpId and route data  
#
# Returns a Hash object
def who_topped params
  # Set the id of the bloc to be interrogated and delete the :boulder parameter
  bloc_id = params[:boulder] || 1
  params.delete :boulder
  
  # Interrogate the database
  dataset = DB[:Results].where(params)
  dataset
    .select(:Climbers__lastname, :Climbers__firstname)
    .where(Sequel.like(:result_json, "%p#{bloc_id}\":\"t%"))
    .join(:Climbers, :PerId => :Results__PerId)
    .limit(30)
    .all
end
# Test
#params = { boulder: 3, WetId: 1, route: 0, GrpId: 5 }
#p who_topped params

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

def test_array_update params
  rec = DB[:Results].where(params)
  #rec.update({ param: '{2,2,3,4}' })
  r1 = 2
  # Have to create this outside the assignment
  s  = "{#{r1},4,4,4}"
  rec.update({ param: s })
end

params = { wet_id: 1, grp_id: 6, route: 0, per_id: 6550 }
#p test_view params
#test =  create_uuid params

#p params
#p create_uuid params
#p params
p test_array_update params


#SELECT "WetId", "GrpId", "route" "PerId", "lastname","firstname","nation","GrpId", "route", rank() OVER (ORDER BY "rank_param" ASC,"rank_prev_heat" ASC) AS "result_rank", "result","result_json", "rank_prev_heat"
#FROM `Results` JOIN "Climbers" USING ("PerId") WHERE "WetId" = 1 AND "GrpId" = 5 AND "route" = 2 

#dataset = DB[:Results].where({ PerId: 1030, route: 2 })
#p dataset
#res_hsh = dataset.select(:result_json).first
#puts "res_hsh #{res_hsh}"
#res_obj = JSON.parse(res_hsh[:result_json], { symbolize_names: true })
#puts "res_obj #{res_obj}"
#res_obj[:p1] = "t1b1"
#
#out_hsh = { result_json: res_obj.to_json }
#puts "out_hsh #{out_hsh}"
#
#def test 
#  {
#    thing: 1,
#    more:  2 + 2
#  }
#end
#p test
#res[:thing] = 1

#dataset.update(out_hsh)