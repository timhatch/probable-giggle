require 'test/unit'
require_relative '../helpers/localdb_accessors_results'

class APITester < Test::Unit::TestCase
  include Perseus::LocalDBConnection::Results

  def test_query
    tests = [
      # Check handling of incomplete arguments
      [{ wet_id: 1030 },                      { wet_id: 1030, grp_id: 0, route: 0 }],
      [{ wet_id: 1030, grp_id: 5 },           { wet_id: 1030, grp_id: 5, route: 0 }],
      [{ wet_id: 1030, grp_id: 5, route: 3 }, { wet_id: 1030, grp_id: 5, route: 3 }],
      # Check handling of optional inputs
      [{ per_id: 1030  },                   { wet_id: 0, grp_id: 0, route: 0, per_id: 1030 }],
      [{ start_order: 1030 },               { wet_id: 0, grp_id: 0, route: 0, start_order: 1030 }],
      [{ per_id: 1030, start_order: 1031 }, { wet_id: 0, grp_id: 0, route: 0, per_id: 1030 }],
      # Check handling of invalid data
      [{ wet_id: 'hello' },               { wet_id: 0, grp_id: 0, route: 0 }],
      [{ wet_id: 1111, grp_id: 'hello' }, { wet_id: 1111, grp_id: 0, route: 0 }],
      [{ per_id: 'hello' },               { wet_id: 0, grp_id: 0, route: 0, per_id: 0 }]
    ]

    tests.each do |x|
      assert_equal(x[1], Perseus::LocalDBConnection::Results.query(x[0]))
    end
  end
end
