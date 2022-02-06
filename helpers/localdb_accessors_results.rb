# Module  Perseus                 - The namespace for all application code
# Module  LocalDBConnection       - Helper methods to access the LAN database
# Module  Competition             - Competition related methods
#
require 'sequel'
require 'pg'
# require 'json'

# Debugging
require_relative 'localdb_accessors'
require_relative 'ifsc_boulder_modus'
require_relative 'query_types'

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
                  :rank_prev_heat, :sort_values, :result_jsonb)
          .select_append(&method(:rank))
          .order(order_by.to_sym)
      end

      # rubocop:disable AlignHash
      def self.update_result results, data
        new_result = Perseus::IFSCBoulderModus.merge(results.first[:result_jsonb], data)
        sort_array = Perseus::IFSCBoulderModus.sort_values(new_result)

        results.update(
          sort_values:  Sequel.pg_array(sort_array),
          result_jsonb: Sequel.pg_jsonb(new_result)
        )
      end
      # rubocop:enable AlignHash

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
                    .update(sort_values: nil, result_jsonb: nil)
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
        data = params[:result_jsonb] || {}
        DB[:Results].where(QueryType.result[params].merge(locked: false))
                    .yield_self { |x| x.all.empty? ? 0 : update_result(x, data) }
      rescue StandardError
        0
      end

      # lock :: (a) -> (1|0)
      # Lock (default) or unlock results for a route|competitor
      # returns 1|0 if successful|unsuccessful or if an error is thrown
      def lock params
        DB[:Results].where(QueryType.result[params])
                    .update(locked: params.key?(:locked) ? params[:locked] : true)
      rescue StandardError
        0
      end

      # Update database entries with a result_rank value
      # Call this value 'rank_this_heat' to distinguish it from the 'result_rank' value that
      # is calculated on-the-fly
      #
      # def append_rank params
      #   data = DB[:Results].where(QueryType.result[params])
      #   data.select(:per_id)
      #       .select_append(&method(:rank))
      #       .each { |x| data.where(per_id: x[:per_id]).update(rank_this_heat: x[:result_rank]) }
      # end
    end
  end
end
# Perseus::LocalDBConnection::Results.rank_this_heat(wet_id: 31, route: 2, grp_id: 6)
# Perseus::LocalDBConnection::Results.fetch(wet_id: 31, route: 2, grp_id: 6, per_id: 29)
# Perseus::LocalDBConnection::Results.append_rank(wet_id: 31, grp_id: 5, route: 0)
