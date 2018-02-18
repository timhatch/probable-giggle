# Module  Perseus                 - The namespace for all application code
# Module  LocalDBConnection       - Helper methods to access the LAN database
# Module  IFSCBoulderModus        - IFSCBoulderModus methods
#
require 'sequel'
require 'pg'
require 'json'

module Perseus
  module IFSCBoulderModus
    private_class_method

    # Simple helper to calculate tops/bonuses and the relevant number of attempts
    # This function is not called if the relevant value is nil (doesn't exist), so
    # internally we just need to check for it existing but having a value of zero
    # @params
    # - An array [x, y] holding the aggregated result and
    # - A value passed in (may be zero)
    # OPTIMIZE: Refactor this as a lambda?
    def self.set_atts array, value
      array[0] += 1 unless value.zero?
      array[1] += value
    end

    module_function

    # NOTE: Updated 18-02-2018 to use the revised scoring system for 2018
    # Sequel helper function to calculate a rank-order value sorting a boulder result by
    # tops (descending), bonuses (descending), top attempts (ascending), bonus attempts
    # (ascending). The desc(nulls: :last) postfix ensures that results with a null value
    # are ranked lower than results with a value of 0 (i.e. competitors who havenot started
    # are always ranked below competitors who have started
    def rank_generator
      [
        Sequel.pg_array_op(:sort_values)[1].desc(nulls: :last),
        Sequel.pg_array_op(:sort_values)[3].desc,
        Sequel.pg_array_op(:sort_values)[2],
        Sequel.pg_array_op(:sort_values)[4],
        :rank_prev_heat
      ]
    end

    # Merge any update into the results, e.g.
    # { p1: { a: 1, b: 1, t:1 }, p2: { a: 2 } }.merge( p2: { a: 3, b: 3 })
    # becomes
    # { p1: { a: 1, b: 1, t:1 }, p2: { a: 3, b: 3 } }
    # @params
    # - A Hash containing the unmodified result
    # - A Hash containing the new result to be merged in
    # NOTE: PostGreSQL's jsonb functionality may allow this to be dispensed with.
    #
    def merge result, update
      result ||= {}
      result.merge(update)
    end

    # Calculate the overall result for the competitor (i.e. 1t2 3b4), storing the result in
    # an array.
    # @params
    # - A hash containing the result, e.g.
    # { p1: { a: 1, b: 1, t:1 }, p2: { a: 3, b: 3 } }
    def sort_values result_jsonb
      barr = [0, 0]
      tarr = [0, 0]

      unless result_jsonb.nil?
        result_jsonb.each do |_k, v|
          set_atts(barr, v['b']) unless v['b'].nil?
          set_atts(tarr, v['t']) unless v['t'].nil?
        end
      end
      tarr + barr
    end
  end
end

# params = { wet_id: 99, grp_id: 5, route: 2 }
# puts Perseus::LocalDBConnection::Results.fetch(params)

# puts Perseus::LocalDBConnection::Results.fetch(params.merge(per_id: 1030)).first

# puts Perseus::LocalDBConnection.delete_route(wet_id: 0)
# puts Perseus::LocalDBConnection.delete_person(99,1030)
# puts Perseus::LocalDBConnection.get_result(wet_id: 99, route: 2, grp_id: 5).all

# params = { wet_id: 99,
#           grp_id: 5,
#           route: 2,
#           per_id: 1030,
#           result_jsonb: { 'p2' => { 'a' => 2, 'b' => 2, 't' => 2 } } }
# Perseus::LocalDBConnection::Results.update_single(params)

#
#
# defs  = { wet_id: 99, per_id: 1030 }
# input = { route: 2, nation: 'AUT' }
#
# puts defs.merge input
#
# h1 = { wet: 0, grp: 0}
# h2 = { 'wet' => 3, 'rte' => { "p1" => { "a" => 1, "b" => 1 }}}
# p Hash[h1.map { |k,v| [k, h2[k.to_s] || v]}]
# p h2

# Check delete_results function
# Perseus::LocalDBConnection.delete_results(wet_id: 1572)

# hash =  { "test" => 1, "result_jsonb" => { "p1" => { "a" => 1, "b" => 1 }} }
# hash.keys.each { |key| hash[key.to_sym] = hash.delete(key) }
# puts hash
