require 'sequel'
require 'pg'
require 'json'

# Set the working directory for testing in Textmate
# Dir.chdir("/users/timhatch/sites/flashresults/ruby")

module Startlist
  #DB = Sequel.sqlite('./data/results.db')
  DB = Sequel.connect(ENV['DATABASE_URL'] || "postgres://timhatch@localhost:5432/test")

  module_function

  def set_starter person
    # PostgreSQL versions < 9.5 do not support insert_ignore or insert_conflict or upsert
    # So this is a very crude approach for upsert
    rec = DB[:Climbers].where('"per_id" = ?', person[:per_id])
    if 1 != rec.update(person)
      DB[:Climbers].insert(person)
    end
  end
end

#Startlist.add_starter({per_id: 1030, firstname: 'Sabine'})

module Resultlist

  #DB = Sequel.sqlite('./data/results.db')
  DB = Sequel.connect(ENV['DATABASE_URL'] || "postgres://timhatch@localhost:5432/test")

  module_function

  # Public: Interface to the eGroupware-format results display
  #
  # params -  A Hash containing
  #           :wet_id -  The unique reference id for the competition
  #           :route -  The unique reference for the route/round
  #           and for a single result
  #           :per_id -  The unique reference number for the climber
  #
  # Returns an array of Hash objects
  #
  def get_results params
    DB[:Ranking]
      .where(params)
      .all
  end

  # Public: Update the results database
  #
  # params -  A Hash containing (required)
  #           :wet_id -  The unique reference id for the competitions
  #           :route  -  The unique reference for the route/round
  #           :per_id -  The unique reference number for the climber
  #
  def set_result_single params
    DB[:Results]
      .where(params)
      .update(result_json: params[:result_json], result: params[:result])
  end
end

#params = { per_id: 1030, wet_id: 1, route: 0 }
#p Climber.get_result(params)
#p Climber.get_result(params).to_json
#require 'test/unit'
#
#class TestClimber < Test::Unit::TestCase
#  def test_get_data
#    resp = Climber.get_data 1030
#    expt = "{\"per_id\":1030,\"lastname\":\"Bacher\",\"firstname\":\"Barbara\",\"club\":\"OEAV Inneroetztal\",\"nation\":\"AUT\",\"birthyear\":1982}"
#    assert_equal resp, expt
#  end
#
#  def test_create_uuid
#    p = { per_id: 1030, wet_id: 9999, route: 2 }
#    resp = Climber.create_uuid p
#    expt = 103099992
#    assert_equal resp, expt
#  end
#end

#params = { per_id: 6550, grp_id: 6, result_json: '{"p1":"t1b1","p2":"t2b2","p3":"t1b1"}' }
#Climber.set_result params
#
#data = Climber.get_result per_id: 6550, wet_id: 1, grp_id: 6
#p JSON.parse(data[:result_json], { symbolize_names: true })
