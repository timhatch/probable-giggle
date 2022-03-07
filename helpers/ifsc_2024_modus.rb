# frozen_string_literal: true

# Module  Perseus                 - The namespace for all application code
# Module  IFSC2024Modus           - Ranking/scoring methods for the Paris 2024 competition format
#

require 'sequel'
require 'pg'

module Perseus
  module IFSC2024Modus
    # sig: (Hash hash) -> (Hash)
    def self.deep_transform_keys(hash)
      hash.reduce({}) { |m, (k, v)| m.merge(k.to_sym => v.transform_keys(&:to_sym)) }
    end

    # NOTE: Multiply by 10 as sort values are required to be integers and
    # NOTE: Use a simple hash key transformer
    # the Paris2024 format scores in 0.1 increments.
    # Assume points scores are stored under key :n
    #
    # sig: (Hash hash, Array[Symbol] keys) -> (Integer)
    def self.cumulative_score(hash, keys)
      data = deep_transform_keys(hash)
      10 * keys.reduce(0) { |memo, key| memo + data&.dig(key, :n).to_f }
    end

    # sig: () -> Array[Sequel::SQL::OrderedExpression])
    def self.rank_expression
      [
        Sequel.pg_array_op(:sort_values)[1].desc(nulls: :last),
        Sequel.pg_array_op(:sort_values)[2].desc,
        :rank_prev_heat
      ]
    end

    module_function

    # A rank method to calculate ranking within the round
    # Sequel.function(:rank).over can be alternately expressed as rank.function.over
    #
    # sig: () -> (Sequel::SQL::Function)
    def ranker
      Sequel.function(:rank).over(
        partition: %i[wet_id grp_id route],
        order: rank_expression
      )
    end

    # Return the sort_values array for some result:
    # - the total points score (can be nil)
    # - the best rank on either boulder/lead
    # - the worst rank on either boulder/lead
    #
    # sig: (Hash result_jsonb) -> (Array[Integer])
    def sort_values(result_jsonb)
      b = cumulative_score(result_jsonb, %i[p1 p2 p3 p4]).round
      l = cumulative_score(result_jsonb, %i[p5]).round

      [b + l, [b, l].max]
    end
  end
end

# rubocop:disable Style/BlockComments
=begin
module Rankers
  # Sort an array of hashes <results> on <key> in descending order of retrieved values, grouping
  # sorted results by these values (to establish ties)
  # (array: Array[Hash]) -> (Array[Array[Hash]])
  # TODO: Allow ascending or descending order sorting
  def self.order(array, key)
    compare = ->(a, b) { b[key] <=> a[key] }

    array.sort(&compare).group_by { _1[key] }.values
  end

  module_function

  # (results: Array[Hash], key: Symbol, ?rank: Integer) -> (Array[Hash])
  #
  # Given an array of results Hashes,
  # algorithm at: https://rosettacode.org/wiki/Ranking_methods#Ruby
  def standard_rank(results, key, rank = 1)
    order(results, key).flat_map do |items|
      items.map { _1.merge(rank: rank) }.tap { rank += items.count }
    end
  end
end
=end
# rubocop:enable Style/BlockComments
