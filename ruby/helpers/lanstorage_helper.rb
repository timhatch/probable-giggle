# Module  Perseus                 - The namespace for all application code
# Module  LocalDBConnection           - Helper methods to access the LAN database
#                                   LocalDBConnection methods are broken into a series of blocks
#                                   (we may at some stage convert these into individual
#                                   sub-modules, but that seems like overkill at present.
#                                   1) At the head of this file, the base module declaration
#                                   2) Results Accessor methods
#                                   3) Competition Accessor methods
#                                   4) Session Accessor methods
#
require 'sequel'
require 'pg'
require 'json'

# Base module declaration, instantiates a connection to a Postgresql database
#
module Perseus
  # LocalDBConnection
  module LocalDBConnection
    # Instantiate database access
    DB = Sequel.connect(ENV['DATABASE_URL'] || 'postgres://timhatch@localhost:5432/test')
    DB.extension :pg_array, :pg_json  # Needed to insert arrays
    Sequel.extension :pg_array_ops    # Needed to query stored arrays
    Sequel.extension :pg_json
  end
end

# Results data getters/setters
#
module Perseus
  module LocalDBConnection
    module Results
      # Default route parameters
      @default_route = { wet_id: 0, grp_id: 0, route: 0 }

      # Notionally private methods
      private_class_method

      # Return a sequel object to fetch either __single__ or __multiple__ results
      #
      # OPTIMIZE: THE RANK FUNCTION DOES NOT WORK IF ONLY A SINGLE CLIMBER'S RESULTS ARE
      # RETRIEVED. WE'D NEED TO USE A POSTRES VIEW TO PRESERVE RANKINGS...
      # AND IF WE'RE COING TO USE A VIEW THEN WE MAY BE ABLE TO DISPENSE WITH SOME OF THIS
      # ALSO WE NEED TO DEAL WITH THE GENERAL RESULT
      #
      def self.get_result params, order_by: 'result_rank'
        DB[:Results]
          .join(:Climbers, [:per_id])
          .where(params)
          .select(:per_id, :lastname, :firstname, :nation, :start_order,
                  :sort_values, :result_jsonb)
          .select_append {
            rank.function.over(
              partition: [:wet_id, :grp_id, :route],
              order: Perseus::IFSCBoulderModus.rank_generator
            ).as(:result_rank)
          }
          .order(order_by.to_sym)
      end

      # Check that a specified climber is identified by either their per_id or their start_number
      # within the round. Prefer the per_id if both are provided
      def self.check_person params
        args = Hash[@default_route.map { |k, v| [k, params[k].to_i || v] }]
        id   = params[:per_id].nil? ? :start_order : :per_id
        args.merge(id => params[id].to_i)
      end

      module_function

      # Helper method to import a startlist into the LAN database
      def delete params
        DB[:Results].where(params).delete
      end

      # Fetch results for a single person (i.e. for a single climber across the round)
      def result_person params
        args = check_person(params)
        get_result(args).first
      end

      # Fetch results for a collection of results (i.e. for a route)
      # Map the received parameters against the default parameters required for a collection
      # of results abd call the general accessor get_result
      def result_route params
        args = Hash[@default_route.map { |k, v| [k, params[k].to_i || v] }]
        get_result(args).all
      end

      # Update results for a __single__ competitor
      # Updates (a) the result_jsonb property for the specific set of results and (b) the
      # sort_values property used for ranking
      #
      # @params = {
      #   wet_id: 0, grp_id: 0, route: 0, per_id: 0,
      #   result_jsonb: { 'p1' => { 'a' => 2, 'b' => 1, 't' => 2 }}
      # }
      def update_single params
        args = check_person(params)
        data = params[:result_jsonb] || {}

        query = DB[:Results].where(args)

        new_result = Perseus::IFSCBoulderModus.merge(query.first[:result_jsonb], data)
        sort_array = Perseus::IFSCBoulderModus.sort_values(new_result)

        query.update(
          sort_values: Sequel.pg_array(sort_array),
          result_jsonb: Sequel.pg_jsonb(new_result)
        )
      end
    end
  end
end

# Startlist data getter/setters
# REVIEW: To be checked
module Perseus
  module LocalDBConnection
    module Startlist
      @default_route = { wet_id: 0, grp_id: 0, route: 0 }

      private_class_method
      
      # Helper method to create a startlist input
      # @params
      # - args, a hash containing :wet_id, :grp_id and :route values (common to all competitors)
      # - person, a hash containing competitor-unique information such as :per_id, start_order
      # NOTE: Probably need to add bib_nr here.
      def self.query args, person
        person['per_id'] = person['PerId'] unless person['PerId'].nil?
        args.merge(
          per_id:         person['per_id'].to_i,
          start_order:    person['start_order'].to_i,
          rank_prev_heat: person['rank_prev-heat'].to_i
        )
      end

      module_function

      # Helper method to import a startlist into the LAN database
      #
      # The data is assumed to ne an array competitors, each a ruby Hash containing at least
      # a per_id (or PerId) and start_order parameter
      #
      # @params
      # - A has containing:
      # - :wet_id, :grp_id, :route (each integers) defining the comp, category and round
      # - :competitors  An array of competitor data, each competitor having three properties
      #   'PerId' or 'per_id' (the Competitor's id), start_order and rank_prev_heat
      # REVIEW: Probably we need to add :bib_nr
      def insert params
        args        = Hash[@default_route.map { |k, v| [k, params[k].to_i || v] }]
        competitors = params[:competitors]
        # delete any existing results data for the round
        Results.delete(args)
        # Load the starters, converting any 'PerId' parameter (e.g. from eGroupware) into the
        # snake_case format expected here
        begin
          competitors.each do |person|
            data = query(args, person)
            DB[:Results].insert(data)
          end
        rescue
          puts 'nil response'
        end
      end
    end
  end
end

# Competition data getter/setters
#
module Perseus
  module LocalDBConnection
    module Competition
      # Instance variable (could make this a const)
      @default_comp = { wet_id: 0, city: 'Längenfeld', date: '2017-01-01', type: 'B',
                        title: 'Test Competition' }

      module_function

      # Get the "active" competition
      def active
        DB[:Competitions].join(:Session, [:wet_id]).first
      end

      # Insert a new competition (or overwrite an existing competition)
      def insert params
        args = Hash[@default_comp.map { |k, v| [k, params[k] || v] }]
        args[:wet_id] = args[:wet_id].to_i
        DB[:Competitions].where(wet_id: args[:wet_id]).delete
        DB[:Competitions].insert(args)
      end
    end
  end
end

# Session data getter/setters
# The Session table contains only one entry by design
#
module Perseus
  module LocalDBConnection
    module Session
      module_function

      # Get the session data
      def data
        DB[:Session].first
      end

      # Update the Session parameters, either individually or collectively
      # @params
      # - wet_id - the numeric id for the competition
      # - auth   - a string
      # HACK: wet_id is expected to be an INTEGER - Need to verify what's provided...
      def update params
        params.reject! { |k, v| params[k].to_s.empty? } 
        args = Hash[{ wet_id: nil, auth: nil }.map { |k, v| [k, params[k] || v] }]
        DB[:Session].update(args)
      end

      # Clear (reset) the session parameters
      def reset
        DB[:Session].update(wet_id: nil, auth: nil)
      end
    end
  end
end

# Competitor related getters/setters
# OPTIMIZE: Replace the explicit assignment in insert() by a shorthand conversion of the parameters
#   hash passed into the function (as in other sub-modules).
#   anticipation..
module Perseus
  module LocalDBConnection
    module Competitors
      # Notionally private methods
      private_class_method

      def self.query person
        person['per_id'] = person['PerId'] unless person['PerId'].nil?
        DB[:Climbers].where(per_id: person['per_id'].to_i)
      end

      module_function

      # Helper method to import competitors into the local database
      # The "replace" operator is not supported for postgres databases, so use a workaround
      # We assume that the compatitors parameter is an array of hash objects, each object
      # containing the following parameters:
      # per_id, lastname, firstname, federation, nation, birthyear
      # NOTE: The hash contents are assumed to be string (ot symbol) based. This works for the
      # eGroupware response
      def insert competitors
        competitors.each do |person|
          record = query(person)
          break if record.first
          record.insert(
            per_id:    person['per_id'].to_i,
            lastname:  person['lastname'],
            firstname: person['firstname'],
            club:      person['federation'],
            nation:    person['nation'],
            birthyear: person['birthyear'].to_i
          )
        end
      end
    end
  end
end

module Perseus
  module IFSCBoulderModus
    private_class_method

    # Simple helper to calculate tops/bonuses and the relevant number of attempts
    # The tests to call this function are all extenal, so it is pretty cimple
    # @params
    # - An array [x, y] holding the aggregated result and 
    # - A non-zero value passed in
    # OPTIMIZE: Refactor this as a lambda?
    def self.set_atts array, value
      array[0] += 1
      array[1] += value
    end

    module_function

    # Sequel helper function to calculate a rank-order value sorting a boulder result by 
    # tops (descending), top attempts (ascending), bonuses (descending), bonus attempts 
    # (ascending). The desc(nulls: :last) postfix ensures that results with a null value
    # are ranked lower than results with a value of 0 (i.e. competitors who havenot started
    # are always ranked below competitors who have started
    def rank_generator
      [
        Sequel.pg_array_op(:sort_values)[1].desc(nulls: :last),
        Sequel.pg_array_op(:sort_values)[2],
        Sequel.pg_array_op(:sort_values)[3].desc,
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
# puts Perseus::LocalDBConnection::Results.result_route(params)

# puts Perseus::LocalDBConnection::Results.result_person(params.merge(per_id: 1030))

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
