# frozen_string_literal: true

# Module  Perseus                 - The namespace for all application code
# Module  IFSC2024Modus           - Ranking/scoring methods for the Paris 2024 competition format
#

require 'sequel'
require 'pg'

module Perseus
  module IFSC2024Modus
    # NOTE: By default, keys in the `data` hash are strings
    SCORES = { 't' => 25, 'Z' => 6, 'b' => 3 }.freeze

    # sig: (Hash hash) -> (Hash)
    def self.deep_transform_keys(hash)
      hash.reduce({}) { |m, (k, v)| m.merge(k.to_sym => v.transform_keys(&:to_sym)) }
    end

    # the Paris2024 format scores in 0.1 increments. Multiply by 10 as sort values are required to
    # be integers
    # Assume points scores are stored under key 'n'
    #
    # NOTE: By default, both Sequel and Sinatra store json/jsonb data with string-based keys
    #
    # sig: (Hash hash, Array[String] keys) -> (Integer)
    def self.cumulative_score(hash, keys)
      10 * keys.reduce(0) { |memo, key| memo + hash&.dig(key, 'n').to_f }
    end

    # sig: () -> Array[Sequel::SQL::OrderedExpression])
    def self.rank_expression
      [
        Sequel.pg_array_op(:sort_values)[1].desc(nulls: :last),
        Sequel.pg_array_op(:sort_values)[2].desc,
        :rank_prev_heat
      ]
    end

    # Given some result hash, typically of the form:
    # - ?a: Integer?    # Number of attempts | nil
    # - ?b: Integer?    # Attempts to score the first Zone | nil
    # - ?Z: Integer?    # Attempts to score the second Zone | nil
    # - ?t: Integer?    # Attempts tp score the Top | nil
    # - ?h: Float?      # Height gained on a route
    # Calculate the corresponding points <n> for the result
    #
    # NOTE: By default, both Sequel and Sinatra store json/jsonb data with string-based keys
    #
    # sig: (Hash result) -> (Integer)
    def self.points(result)
      return result['h'] if result&.fetch('h', nil)

      %w[t Z b].map do |key|
        a = result&.fetch(key, 0) || 0
        a.zero? ? 0 : SCORES[key] - (0.1 * (a - 1))
      end.max
    end

    module_function

    # Given some results, e.g. { 'p1' => Hash, 'p2' => Hash, ...}
    # Return a modified result, calculating and appending points scores for each individual
    # results
    #
    # sig: (Hash results) -> (Hash)
    def append_scores(results)
      append = ->(r) { r.merge!('n' => points(r)) }

      results.reduce({}) { |m, (k, v)| m.merge!(k => append[v]) }
    end

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
    # NOTE: By default, both Sequel and Sinatra store json/jsonb data with string-based keys
    #
    # sig: (Hash result_jsonb) -> (Array[Integer])
    def sort_values(result_jsonb)
      b = cumulative_score(result_jsonb, %w[p1 p2 p3 p4]).round
      l = cumulative_score(result_jsonb, %w[p5]).round

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
