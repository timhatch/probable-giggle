require 'test/unit'
require_relative '../helpers/egroupware_helper.rb'

class EGroupwarePrivateAPITester < Test::Unit::TestCase
  include Perseus::EGroupwarePrivateAPI

  # Test the Perseus::EGroupwarePublicAPI.capitalize_params method
  def test_capitalize_params
    # Expected Output
    target_resp1 = { 'WetId' => 1030, 'route' => 2 }
    # Test Input
    test_params1 = { 'wet_id' => 1030, 'route' => 2 }

    # Assertions
    assert_equal(target_resp1, capitalize_params(test_params1))
  end

  def test_flatten_results
    # Expected Output
    target_resp1 = { 'boulder' => 1, 'try' => 4, 'bonus' => 1, 'top' => 4 }
    target_resp2 = { 'boulder' => 1, 'try' => 4, 'bonus' => 1, 'top' => nil }
    target_resp3 = { 'boulder' => 22, 'try' => nil, 'bonus' => nil, 'top' => nil }
    # Test Input
    test_params1 = { 'p1' => { 'a' => 4, 'b' => 1, 't' => 4 } }
    test_params2 = { 'p1' => { 'a' => 4, 'b' => 1, 't' => nil } }
    test_params3 = { 'p22' => { 'a' => nil, 'b' => nil, 't' => nil } }

    # Assertions
    assert_equal(target_resp1, flatten_results(test_params1))
    assert_equal(target_resp2, flatten_results(test_params2))
    assert_equal(target_resp3, flatten_results(test_params3))
  end

  def test_compose_boulder_measurement_data
    # Expected Output
    target_resp1 = { 'request' => { 'parameters' => [{
      'WetId' => 99, 'GrpId' => 5, 'route' => 2, 'PerId' => 6326,
      'boulder' => 2, 'try' => 4, 'bonus' => 2, 'top' => nil,
      'updated' => DateTime.now.new_offset(Rational(0, 24)).to_s
    }]}}
    # Test Input
    test_params1 = {
      'wet_id' => 99, 'grp_id' => 5, 'route' => 2, 'per_id' => 6326,
      'result_jsonb' => { 'p2' => { 'a' => 4, 'b' => 2, 't' => nil } }
    }

    # Assertions
    assert_equal(target_resp1, compose_boulder_measurement_data(test_params1))
  end
end
