require 'sequel'
require 'json'

# Set the working directory for testing in Textmate
#Dir.chdir("/users/timhatch/sites/flashresults/ruby")

module Resultlist 

  DB = Sequel.sqlite('./data/results.db')

  module_function
  
  # Required params WetId, GrpId. Returns n results
  def get_result params
    DB[:Results]
      .where(WetId: params[:WetId])
      .where(GrpId: params[:GrpId])
      .join(:Climbers, :PerId => :PerId)
  end
  
  def set_result params
    
  end
end

module Climber
  DB = Sequel.sqlite('./data/results.db')

  module_function
  
  # Public: Fetch climber data from the database
  # 
  # perid -   The unique reference number for the climber
  #
  # Returns a JSON object
  def get_data perid
    DB[:Climbers]
      .where(PerId: perid)
      .first
      .to_json
  end
  
  # Required params: PerId, WetId, GrpId. Returns 1 result as JSON
  def get_result params
    id = create_uuid params
    DB[:Results]
      .where(resid: id)
      .join(:Climbers, :PerId => :Results__PerId)
      .join(:Params,   :GrpId => :Results__GrpId)
      .first
      .to_json
  end
  
  #
  def set_result params
    p "called set_result with params = "
    p params  
    id = create_uuid params
    p id
    DB[:Results]
      .where(resid: id)
      .update(ResString: params[:ResString], ResSummary: params[:ResSummary])
  end
  
  # Internal
  #
  # params -  A Hash containing
  #           :PerId -  The unique reference number for the climber   (default: 1030)
  #           :WetId -  The unique reference id for the competitions  (default: 1)
  #           :route -  The unique reference for the route/round      (default: 0)
  #
  # Returns a unique uuid calculated from the params 
  def create_uuid params
    p = 100000 * (params.has_key?(:PerId) ? params[:PerId].to_i : 1030)
    w =     10 * (params.has_key?(:WetId) ? params[:WetId].to_i :    1)
    r =          (params.has_key?(:route) ? params[:route].to_i :    0)
    w + p + r  
  end
end

#params = { PerId: 1030, WetId: 1, route: 0 }
#p Climber.get_result(params)
#p Climber.get_result(params).to_json
#require 'test/unit'
#
#class TestClimber < Test::Unit::TestCase
#  def test_get_data
#    resp = Climber.get_data 1030 
#    expt = "{\"PerId\":1030,\"Lastname\":\"Bacher\",\"Firstname\":\"Barbara\",\"Club\":\"OEAV Inneroetztal\",\"Country\":\"AUT\",\"Birthyear\":1982}"
#    assert_equal resp, expt
#  end
#  
#  def test_create_uuid  
#    p = { PerId: 1030, WetId: 9999, route: 2 }
#    resp = Climber.create_uuid p
#    expt = 103099992
#    assert_equal resp, expt
#  end
#end

#params = { PerId: 6550, GrpId: 6, ResString: '{"p1":"t1b1","p2":"t2b2","p3":"t1b1"}' }
#Climber.set_result params
#
#data = Climber.get_result PerId: 6550, WetId: 1, GrpId: 6 
#p JSON.parse(data[:ResString], { symbolize_names: true })