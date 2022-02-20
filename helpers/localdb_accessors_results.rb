# Module  Perseus                 - The namespace for all application code
# Module  LocalDBConnection       - Helper methods to access the LAN database
# Module  Competition             - Competition related methods
#
require 'sequel'
require 'pg'
require 'json'

# Debugging
require_relative 'localdb_accessors'
require_relative 'ifsc_boulder_modus'
require_relative 'query-types'

# Results data getters/setters
#
module Perseus
  module LocalDBConnection
    module Results
      # Default route parameters
      @default_route = { wet_id: 0, grp_id: 0, route: 0 }

      # A rank method to calculate ranking within the round
      # OPTIMIZE: THE RANK FUNCTION DOES NOT WORK IF ONLY A SINGLE CLIMBER'S RESULTS ARE
      # RETRIEVED. WE'D NEED TO USE A POSTGRES VIEW TO PRESERVE RANKINGS...
      # AND IF WE'RE COING TO USE A VIEW THEN WE MAY BE ABLE TO DISPENSE WITH SOME OF THIS
      # ALSO WE NEED TO DEAL WITH THE GENERAL RESULT
      # Sequel.function(:rank).over can be alternately expressed as rank.function.over
      #
      def self.rank
        Sequel.function(:rank).over(
          partition: %i[wet_id grp_id route],
          order: Perseus::IFSCBoulderModus.rank_generator
        ).as(:result_rank)
      end

      # Return a sequel object to fetch either __single__ or __multiple__ results
      #
      def self.get_result params, order_by: 'result_rank'
        DB[:Results]
          .join(:Climbers, [:per_id])
          .where(params)
          .select(:per_id, :lastname, :firstname, :nation, :birthyear, :start_order,
                  :rank_prev_heat, :sort_values, :result_jsonb, :locked)
          .select_append(&method(:rank))
          .order(order_by.to_sym)
      end

      # rubocop:disable Layout/HashAlignment
      def self.update_result(dataset, data)
        new_result = Perseus::IFSCBoulderModus.merge(dataset.first[:result_jsonb], data)
        sort_array = Perseus::IFSCBoulderModus.sort_values(new_result)

        dataset.update(
          sort_values:  Sequel.pg_array(sort_array),
          result_jsonb: Sequel.pg_jsonb(new_result)
        )
      end
      # rubocop:enable Layout/HashAlignment

      # Change the status of some results to locked == false
      # @query = :wet_id, :grp_id, :route[, :per_id]
      def self.unlock(query)
        DB[:Results].returning(:per_id, :locked).where(query).update(locked: false)
      end

      # Change the status of some results to locked == true
      # @query = :wet_id, :grp_id, :route
      # rubocop:disable Metrics/AbcSize
      def self.lock(query)
        dataset = DB[:Results].select(:per_id).select_append(&method(:rank)).where(query)
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

      # delete :: ({:wet_id, :grp_id, :route[, :per_id]}) -> (1|0)
      # Delete the complete entry for a given UNLOCKED route | competitor
      # returns 1|0 if successful|unsuccessful or if an error is thrown
      def delete params
        DB[:Results].where(QueryType.result[params].merge(locked: false))
                    .delete
      rescue StandardError
        0
      end

      # reset :: (a) -> (1|0)
      # Reset the sort_values and result_jsonb fields to nil values for a given
      # UNLOCKED route | competitor
      # returns 1|0 if successful|unsuccessful or if an error is thrown
      def reset params
        DB[:Results].where(QueryType.result[params].merge(locked: false))
                    .update(sort_values: nil, result_jsonb: nil, rank_this_heat: nil)
      rescue StandardError
        0
      end

      # fetch :: (a) -> ([b])
      # Fetch an array of results <[b]> for a route <a>
      def fetch params
        QueryType.result[params].yield_self { |x| get_result(x).all }
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
        json    = params[:result_jsonb] || {}
        dataset = DB[:Results].where(QueryType.result[params].merge(locked: false))
        dataset.all.empty? ? 0 : update_result(dataset, json)
      rescue StandardError
        0
      end

      # "Unsafe" updates - Stored sort_values and results are overwritten without checks
      def update_single!(params)
        dataset = DB[:Results].where(QueryType.result[params].merge(locked: false))

        dataset.update(
          sort_values: Sequel.pg_array(params.fetch(:sort_values, [0, 0, 0, 0])),
          result_jsonb: Sequel.pg_jsonb(params.fetch(:result_jsonb, {}))
        )
      end

      # lock :: (a) -> (1|0)
      # NOTE: Use QueryType to handle string vs. symbol hash issues
      def lockstate(params)
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
