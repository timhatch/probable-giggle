# frozen_string_literal: true

# Module  Perseus                 - The namespace for all application code
# Module  LocalDBConnection       - Helper methods to access the LAN database
# Module  IFSCBoulderModus        - IFSCBoulderModus methods
#
require 'sequel'
require 'pg'
require 'json'

module Perseus
  module IFSCBoulderModus
    # private_class_method

    # Simple helper to calculate tops/bonuses and the relevant number of attempts
    # This function is not called if the relevant value is nil (doesn't exist), so
    # internally we just need to check for it existing but having a value of zero
    # @params
    # - An array [x, y] holding the aggregated result and
    # - A value passed in (may be zero)
    # OPTIMIZE: Refactor this as a lambda?
    #
    # sig: (Array[Integer] array, Integer value) -> (Array[Integer])
    def self.set_atts array, value
      array[0] += 1 unless value.zero?
      array[1] += value
    end

    # NOTE: Updated 18-02-2018 to use the revised scoring system for 2018
    # Sequel helper function to calculate a rank-order value sorting a boulder result by
    # tops (descending), bonuses (descending), top attempts (ascending), bonus attempts
    # (ascending). The desc(nulls: :last) postfix ensures that results with a null value
    # are ranked lower than results with a value of 0 (i.e. competitors who havenot started
    # are always ranked below competitors who have started
    #
    # sig: () -> Array[Sequel::SQL::OrderedExpression])
    def self.rank_expression
      [
        Sequel.pg_array_op(:sort_values)[1].desc(nulls: :last),
        Sequel.pg_array_op(:sort_values)[3].desc,
        Sequel.pg_array_op(:sort_values)[2],
        Sequel.pg_array_op(:sort_values)[4],
        :rank_prev_heat
      ]
    end

    module_function

    # A rank method to calculate ranking within the round
    # OPTIMIZE: THE RANK FUNCTION DOES NOT WORK IF ONLY A SINGLE CLIMBER'S RESULTS ARE
    # RETRIEVED. WE'D NEED TO USE A POSTGRES VIEW TO PRESERVE RANKINGS...
    # AND IF WE'RE COING TO USE A VIEW THEN WE MAY BE ABLE TO DISPENSE WITH SOME OF THIS
    # ALSO WE NEED TO DEAL WITH THE GENERAL RESULT
    # Sequel.function(:rank).over can be alternately expressed as rank.function.over
    #
    # sig: () -> (Sequel::SQL::Function)
    def ranker
      Sequel.function(:rank).over(
        partition: %i[wet_id grp_id route],
        order: rank_expression
      )
    end

    # Calculate the overall result for the competitor (i.e. 1t2 3b4), storing the result in
    # an array.
    # @results is a hash of hash results, e.g.
    # {
    #   p1: { 'a' => 1, 'b' => 1, 't' => 1 },
    #   'p2' => { 'a' => 3, 'b' => 3 }
    # }
    # NOTE: This method appears to be sensitive to whether the keys for any given result
    # are symbols or strings.
    #
    # sig: (Hash result_jsonb) -> (Array[Integer])
    def sort_values(result_jsonb)
      barr = [0, 0]
      tarr = [0, 0]

      # TODO: Maybe fix this dependency on string keys using dry-types?
      result_jsonb&.each do |_k, v|
        v.transform_keys!(&:to_s)
        set_atts(barr, v['b']) unless v['b'].nil?
        set_atts(tarr, v['t']) unless v['t'].nil?
      end

      tarr + barr
    end
  end
end
