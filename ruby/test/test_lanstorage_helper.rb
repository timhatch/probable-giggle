
require 'test/unit'
require_relative '../helpers/lanstorage_helper.rb'

class Session < Test::Unit::TestCase
  include Perseus::LANStorageAPI

  def test_reset
    Session.reset
    resp0 = DB[:Session].first
    assert_equal({ wet_id: nil, auth: nil }, resp0)
  end
  
  def test_update
    Session.update(wet_id: 99)
    resp1 = DB[:Session].select.first
    assert_equal({ wet_id: 99, auth: nil }, resp1)
    Session.reset

    Session.update(auth: 'hermione')
    resp2 = DB[:Session].first
    assert_equal({ wet_id: nil, auth: 'hermione' }, resp2)
    Session.reset

    Session.update(wet_id: 99, auth: 'abracadabra')
    resp3 = DB[:Session].first
    assert_equal({ wet_id: 99, auth: 'abracadabra' }, resp3)
    
    Session.update(per_id: 1030, 'wet_id' => 21)
    resp4 = DB[:Session].first
    assert_equal(resp3, resp4)
  end

  # Test the Perseus::EGroupwarePublicAPI.capitalize_params method
  def test_data
    # Expected Output
    resp6 = DB[:Session].first
    assert_equal(resp6, Session.data)
  end
end

class Competitors < Test::Unit::TestCase
  include Perseus::LANStorageAPI

  def test_query
    test_result = DB[:Climbers].where(per_id: 1030).first
    assert_equal(test_result, Competitors.query('PerId' => 1030).first)
  end

  def test_insert
    test_array  = [{ 'per_id' => 1_000_000, 'lastname' => 'test' }]
    Competitors.insert(test_array)
    check_result = DB[:Climbers].where(per_id: 1_000_000).first
    check_result.keep_if { |_k, v| !v.nil? }
    test_result = { per_id: 1_000_000, lastname: 'test', birthyear: 0 }
    assert_equal(test_result, check_result)
  end
end
