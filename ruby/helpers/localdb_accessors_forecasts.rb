# Module  Perseus                 - The namespace for all application code
# Module  LocalDBConnection       - Helper methods to access the LAN database
# Module  Competition             - Competition related methods
#
require 'sequel'
require 'pg'
require 'json'

# NOTE: REQUIRED FOR STANDALONE TESTING ONLY
require_relative './localdb_accessors.rb'
require_relative './localdb_accessors_results.rb'
require_relative './ifsc_boulder_modus.rb'

# Results data getters/setters
#
module Perseus
  module LocalDBConnection
    module Forecasts
      # Default route parameters
      @default_route = { wet_id: 0, grp_id: 0, route: 0 }

      # Notionally private methods
      private_class_method

      # Synthesise a "best" result by assuming flashes for any yet unstarted boulders
      #
      def self.synthesise_result result
        flash = { 'a' => 1, 'b' => 1, 't' => 1 }
        blocs = %w(p1 p2 p3 p4)
        blocs.each do |x|
          result[x] ||= flash
          result[x]['a'].nil? && result[x] = flash
        end
      end

      # Evaluate the potential best result for a competitor
      #
      def self.calculate_max_result
        @results.each do |r|
          next if r[:result_jsonb].nil?
          r[:comparator] = Hash[r[:result_jsonb]]
          synthesise_result(r[:comparator])
          r[:min_result] = r.delete(:sort_values)
          r[:max_result] = Perseus::IFSCBoulderModus.sort_values(r.delete(:comparator))
        end
      end

      # Update the sort_value parameter used for the forecast
      #
      def self.sort_values per_id, data
        DB[:Forecast].where(per_id: per_id).update(sort_values: Sequel.pg_array(data))
      end

      # 
      def self.calculate_rank per_id
        DB[:Forecast]
          .select(:per_id, :sort_values, :rank_prev_heat)
          .select_append { rank.function.over(order: Perseus::IFSCBoulderModus.rank_generator) }
          .all
          .select { |a| a[:per_id] == per_id }
          .first[:rank]
      end

      # Generate synthetic rankings, iterating through the relevant climbers and comparing their
      # potential results against those of the rest of the field
      #
      # @params
      #   ranking   - the ranking to calculate max_rank or min_rank
      #   test_key  - the test result for the climber (e.g. their max/min result)
      #   base_key  - the comparison results for the rest of the field
      # e.g. the parameters :max_rank, :max_result, :min_result
      # will produce the "best possible ranking" for each climber by testing their calculated
      # "max_result" against the "min_result" for the rest of the field
      #
      def self.generate_ranking ranking, test_key, base_key
        @results.each { |r| sort_values(r[:per_id], r[base_key]) }

        @results.each do |r|
          sort_values(r[:per_id], r[test_key])
          r[ranking] = calculate_rank(r[:per_id])
          sort_values(r[:per_id], r[base_key])
        end
      end

      module_function

      @results = []

      #
      # @params = {
      #   wet_id: 0, grp_id: 0, route: 0, per_id: 0,
      #   result_jsonb: { 'p1' => { 'a' => 2, 'b' => 1, 't' => 2 }}
      # }
      def forecast params
        # Create a temporary database from the query data
        # data = Perseus::LocalDBConnection::Results.result_route(params)
        DB.create_table!(:Forecast, as: DB[:Results].where(params))

        @results = DB[:Forecast].all

        calculate_max_result
        generate_ranking(:max_rank, :max_result, :min_result)
        generate_ranking(:min_rank, :min_result, :max_result)
        @results.each { |x| p x }
      end
    end
  end
end

Perseus::LocalDBConnection::Forecasts.forecast(wet_id: 99, route: 2, grp_id: 5)
