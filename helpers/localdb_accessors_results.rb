# frozen_string_literal: true

# Module  Perseus                 - The namespace for all application code
# Module  LocalDBConnection       - Helper methods to access the LAN database
# Module  Competition             - Competition related methods
#
require 'sequel'
require 'pg'
require 'json'

# Debugging
require_relative 'localdb_accessors'
require_relative 'ifsc_2024_modus'
require_relative 'query-types'

# Dataset operations
#
module Perseus
  module LocalDBConnection
    module Results
      # Return the dataset of unlocked competitors given @params
      # (Hash query) -> (Sequel::Dataset)
      def self.unlocked(query)
        DB[:Results].where(query.merge(locked: false))
      end

      # Return the dataset joining climber info and results for some given @query
      # (Hash query) -> (Sequel::Dataset)
      def self.personalia(query)
        DB[:Results]
          .join(:Climbers, [:per_id])
          .where(query)
          .select(:per_id, :lastname, :firstname, :nation, :birthyear, :start_order,
                  :rank_prev_heat, :sort_values, :result_jsonb, :locked)
      end
    end
  end
end

# Results data getters/setters
#
module Perseus
  module LocalDBConnection
    module Results
      # Append ranking data and return the sort sequel dataset @dataset
      # (Sequel::Dataset dataset, ?order_by: String) -> (Sequel::Dataset)
      def self.get_result(dataset, order_by: 'result_rank')
        dataset
          .select_append(Perseus::IFSC2024Modus.ranker.as(:result_rank))
          .order(order_by.to_sym)
      end

      # Given some new results <data>, assumed to be a hash containing results for one or more
      # boulders/routes:
      # - Calculate and append the point scores for each buolder/route (append_scores)
      # - Merge the new results into the corresponding "old" results for the relevant <dataset>
      # - Calculate the updated sorting values used for rank calculations
      # - Update the stored results
      #
      # (Sequel::Dataset dataset, Hash data) -> (Integer) # Returns the number of records updated
      def self.update_result(dataset, data)
        with_score = Perseus::IFSC2024Modus.append_scores(data)
        new_result = dataset.first&.fetch(:result_jsonb, {})&.merge(with_score) || with_score
        sort_array = Perseus::IFSC2024Modus.sort_values(new_result)

        dataset.update(
          sort_values: Sequel.pg_array(sort_array),
          result_jsonb: Sequel.pg_jsonb(new_result)
        )
      end

      # Change the status of some results to locked == false
      # (Hash query) -> (Integer) # Returns the number of records updated
      def self.unlock(query)
        DB[:Results].where(query).update(locked: false)
      end

      # rubocop:disable Metrics/AbcSize
      # Change the status of some results to locked == true
      # (Hash query) -> (Integer) # Returns the number of records updated
      def self.lock(query)
        dataset = get_result(DB[:Results].where(query).select(:per_id))

        DB.transaction do
          DB.create_table!(:Ranks, temp: true, as: dataset)

          DB[:Results]
            .from(:Results, :Ranks)
            .where(query).where(Sequel[:Results][:per_id] => Sequel[:Ranks][:per_id])
            .update(rank_this_heat: Sequel[:Ranks][:result_rank], locked: true)
        end
      end
      # rubocop:enable Metrics/AbcSize

      module_function

      # Delete the complete entry for a given UNLOCKED route | competitor
      # (Hash params) -> (Integer)
      def delete params
        unlocked(QueryType.result[params])
          .delete
      rescue StandardError
        0
      end

      # Reset the sort_values and result_jsonb fields to nil values for a given
      # (Hash params) -> (Integer)
      def reset params
        unlocked(QueryType.result[params])
          .update(sort_values: nil, result_jsonb: nil, rank_this_heat: nil)
      rescue StandardError
        0
      end

      # Fetch an array of results
      # (Hash params) -> (Array[Hash])
      def fetch(params)
        dataset = personalia(QueryType.result[params])

        get_result(dataset).all
      rescue StandardError
        []
      end

      # Update results for a __single__ competitor
      # {
      #   wet_id: 0, grp_id: 0, route: 0, per_id: 0,
      #   result_jsonb: { 'p1' => { 'a' => 2, 'b' => 1, 't' => 2 } }
      # }
      # TODO: Validation for :result_jsonb
      def update_single params
        dataset = unlocked(QueryType.result[params])
        json    = params[:result_jsonb] || {}

        dataset.all.empty? ? 0 : update_result(dataset, json)
      rescue StandardError
        0
      end

      # "Unsafe" updates - Stored sort_values and results are overwritten without checks
      # (Hash params) -> (Integer) # Returns the number of records updated
      def update_single!(params)
        dataset = unlocked(QueryType.result[params])

        dataset.update(
          sort_values: Sequel.pg_array(params.fetch(:sort_values, [0, 0])),
          result_jsonb: Sequel.pg_jsonb(params.fetch(:result_jsonb, {}))
        )
      end

      # Change the lock state for the results given by @params
      # (Hash params) -> (Array[String])
      def lockstate(params)
        # NOTE: Use QueryType to handle string vs. symbol hash issues
        query = QueryType.result[params].slice(:wet_id, :grp_id, :route)
        state = QueryType.result[params].fetch(:locked)
        resp  = state.eql?(true) ? lock(query) : unlock(query)
        [200, { body: resp }.to_json]
      rescue StandardError => e
        [500, { body: e.message }.to_json]
      end
    end
  end
end

=begin
# Test Fetch
Perseus::LocalDBConnection::Results
  .fetch(wet_id: 8, route: 1, grp_id: 6)
  .each { p _1.slice(:per_id, :sort_values, :rank_prev_heat) }
=end
