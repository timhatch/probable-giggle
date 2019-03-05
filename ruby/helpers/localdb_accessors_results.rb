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
# Results data getters/setters
#
module Perseus
  module LocalDBConnection
    module Results
      # Default route parameters
      @default_route = { wet_id: 0, grp_id: 0, route: 0 }

      # Notionally private methods
      private_class_method

      # A rank method to calculate ranking within the round
      # OPTIMIZE: THE RANK FUNCTION DOES NOT WORK IF ONLY A SINGLE CLIMBER'S RESULTS ARE
      # RETRIEVED. WE'D NEED TO USE A POSTGRES VIEW TO PRESERVE RANKINGS...
      # AND IF WE'RE COING TO USE A VIEW THEN WE MAY BE ABLE TO DISPENSE WITH SOME OF THIS
      # ALSO WE NEED TO DEAL WITH THE GENERAL RESULT
      # Sequel.function(:rank).over can be alternately expressed as rank.function.over
      #
      def self.rank
        Sequel.function(:rank).over(
          partition: [:wet_id, :grp_id, :route],
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

      # Check that a specified climber is identified by either their per_id or their start_number
      # within the round. Prefer the per_id if both are provided
      #
      def self.query params
        args = Hash[@default_route.map { |k, v| [k, params[k].to_i || v] }]
        if params.key?(:per_id) || params.key?(:start_order)
          id       = params[:per_id].nil? ? :start_order : :per_id
          args[id] = params[id].to_i
        end
        args
      end

      module_function

      # Helper method to delete a startlist or a person (use per_id as an optional
      # parameter to delete an individual rather than the complete list
      # required @params - :wet_id, :grp_id, :route
      # optional @params - :per_id | :start_order
      #
      def delete params
        args = query(params)
        DB[:Results].where(args).delete
      end

      # Helper method to reset results (i.e. to restore the state of one or more competitors to
      # that of a non-starter)
      # required @params - :wet_id, :grp_id, :route
      # optional @params - :per_id | :start_order
      #
      def reset params
        args = query(params)
        DB[:Results]
          .where(args)
          .update(sort_values: nil, result_jsonb: nil)
      end

      # Fetch results for for a single person (if :per_id|:start_order are defined)
      # Fetch results for a category/route (if :per_id|:start_order are not defined
      # If both :per_id and :start_order are defined, use the per_id value
      # required @params - :wet_id, :grp_id, :route
      # optional @params - :per_id | :start_order
      #
      def fetch params
        args = query(params)
        get_result(args).all
      end

      # Fetch results for a category/route (if :per_id|:start_order are not defined
      # NOTE: This method retained pending resolution of backward-compatibility issues for
      #       broadcast results
      # required @params - :wet_id, :grp_id, :route
      #
      def result_route params
        args = Hash[@default_route.map { |k, v| [k, params[k].to_i || v] }]
        get_result(args).all
      end

      # Update results for a __single__ competitor
      # Updates (a) the result_jsonb property for the specific set of results and (b) the
      # sort_values property used for ranking
      # NOTE: No update is posted if the results in question are locked on the server
      # required @params - Hash formatted as follow:
      # {
      #   wet_id: 0, grp_id: 0, route: 0, per_id: 0,
      #   result_jsonb: { 'p1' => { 'a' => 2, 'b' => 1, 't' => 2 }}
      # }
      #
      def update_single params
        args = query(params).merge(locked: false)
        data = params[:result_jsonb] || {}

        results = DB[:Results].where(args)
        return nil if results.all.empty?

        new_result = Perseus::IFSCBoulderModus.merge(results.first[:result_jsonb], data)
        sort_array = Perseus::IFSCBoulderModus.sort_values(new_result)

        results.update(
          sort_values: Sequel.pg_array(sort_array),
          result_jsonb: Sequel.pg_jsonb(new_result)
        )
      end

      # Lock or unlock results for one or more competitors (if no :locked parameter is provided
      # the relevant results will be locked automatically
      # required @params - :wet_id, :grp_id, :route
      # optional @params - :per_id | :start_order
      #
      def lock params
        args = query(params)
        lock = params.key?(:locked) ? params[:locked] : true
        DB[:Results].where(args).update(locked: lock)
      end

      # Update database entries with a result_rank value
      # Call this value 'rank_this_heat' to distinguish it from the 'result_rank' value that
      # is calculated on-the-fly
      #
      def append_rank params
        args = query(params)
        data = DB[:Results].where(args)

        data.select(:per_id)
            .select_append(&method(:rank))
            .each { |x| data.where(per_id: x[:per_id]).update(rank_this_heat: x[:result_rank]) }
      end
    end
  end
end
# Perseus::LocalDBConnection::Results.rank_this_heat(wet_id: 31, route: 2, grp_id: 6)
# Perseus::LocalDBConnection::Results.fetch(wet_id: 31, route: 2, grp_id: 6, per_id: 29)
# Perseus::LocalDBConnection::Results.append_rank(wet_id: 31, grp_id: 5, route: 0)
