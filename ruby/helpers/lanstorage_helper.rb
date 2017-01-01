# Module  Perseus                 - The namespace for all application code
# Module  LANStorageAPI           - Helper methods to access the LAN database
#                                   LANStorageAPI methods are broken into a series of blocks (we
#                                   may at some stage convert these into individual sub-modules,
#                                   but that seems like overkill at present.
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
  # LANStorageAPI
  module LANStorageAPI
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
  module LANStorageAPI
    # Default route parameters
    @default_route = { wet_id: 0, grp_id: 0, route: 0 }

    module_function

    def delete_results params
      DB[:Results].where(params).delete
    end

    # Helper method to import a startlist into the LAN database
    #
    # The data is assumed to ne an array competitors, each a ruby Hash containing at least
    # a per_id (or PerId) and start_order parameter
    #
    # TODO: Fix the params
    #
    def insert_startlist params
      args        = Hash[@default_route.map { |k, v| [k, params[k].to_i || v] }]
      competitors = params[:competitors]
      # delete any existing results data for the round
      delete_results(args)
      # Load the starters, converting any 'PerId' parameter (e.g. from eGroupware) into the
      # snake_case format expected here
      begin
        competitors.each do |person|
          person['per_id'] = person['PerId'] unless person['PerId'].nil?
          hash = args.merge(
            per_id: person['per_id'].to_i,
            start_order: person['start_order'].to_i,
            rank_prev_heat: person['rank_prev-heat'].to_i
          )
          DB[:Results].insert(hash)
        end
      rescue
        puts 'nil response'
      end
    end

    # Return a sequel object to fetch either __single__ or __multiple__ results
    #
    # TODO: FIX THIS, THE RANK FUNCTION DOES NOT WORK IF ONLY A SINGLE CLIMBER'S RESULTS ARE
    # RETRIEVED. WE'D NEED TO USE A POSTRES VIEW TO PRESERVE RANKINGS...
    # AND IF WE'RE COING TO USE A VIEW THEN WE MAY BE ABLE TO DISPENSE WITH SOME OF THIS
    # ALSO WE NEED TO DEAL WITH THE GENERAL RESULT
    #
    def get_result params, order_by: 'result_rank'
      DB[:Results]
        .join(:Climbers, [:per_id])
        .where(params)
        .select(:per_id, :lastname, :firstname, :nation, :start_order, :sort_values, :result_jsonb)
        .select_append {
          rank.function.over(
            partition: [:wet_id, :grp_id, :route],
            order: Perseus::IFSCBoulderModus.rank_generator
          ).as(:result_rank)
        }
        .order(order_by.to_sym)
    end

    def check_person params
      args = Hash[@default_route.map { |k, v| [k, params[k].to_i || v] }]
      id   = params[:per_id].nil? ? :start_order : :per_id
      args.merge(id => params[id].to_i)
    end

    def get_result_person params
      args = check_person(params)
      get_result(args).first
    end

    # Fetch results for a collection of results (i.e. for a route)
    # Map the received parameters against the default parameters required for a collection
    # of results abd call the general accessor get_result
    #
    def get_result_route params
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
    #
    def set_result_person params
      args = check_person(params)
      data = params[:result_jsonb] || {}

      query = DB[:Results].where(args)

      new_result = Perseus::IFSCBoulderModus.set_result(query.first[:result_jsonb], data)
      sort_array = Perseus::IFSCBoulderModus.set_sort_values(new_result)

      query.update(
        sort_values: Sequel.pg_array(sort_array),
        result_jsonb: Sequel.pg_jsonb(new_result)
      )
    end
  end
end

# Competition data getter/setters
#
module Perseus
  module LANStorageAPI

    @default_comp = { wet_id: 0, city: 'Längenfeld', date: '2017-01-01', type: 'B',
                      title: 'Test Competition' }

    module_function

    # Get the "active" competition
    #
    def get_active_competition
      DB[:Competitions].join(:Session, [:wet_id]).first
    end

    # Insert a new competition (or overwrite an existing competition)
    #
    def insert_competition params
      args = Hash[@default_comp.map { |k, v| [k, params[k] || v] }]
      args[:wet_id] = args[:wet_id].to_i
      DB[:Competitions].where(wet_id: args[:wet_id]).delete
      DB[:Competitions].insert(args)
    end
  end
end

# Check function
# Perseus::LANStorageAPI.delete_competition(wet_id: 120)
# puts Perseus::LANStorageAPI.get_active_competition
# Perseus::LANStorageAPI.insert_competition(wet_id: 999)

# Session data getter/setters
# The Session table contains only one entry by design
#
module Perseus
  module LANStorageAPI
    module Session
      module_function

      # Get the session data
      def data
        DB[:Session].first
      end

      # Update the Session parameters, either individually or collectively
      def update params
        args          = {}
        args[:wet_id] = params[:wet_id].to_i unless params[:wet_id].nil?
        args[:auth]   = params[:auth] unless params[:auth].nil?
        DB[:Session].update(args) unless args.empty?
      end

      # Clear (reset) the session parameters
      def reset
        DB[:Session].update(wet_id: nil, auth: nil)
      end
    end
  end
end

# Competitor related getters/setters
#
module Perseus
  module LANStorageAPI
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
          unless record.first
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
end

module Perseus
  module IFSCBoulderModus
    module_function

    def rank_generator
      [
        Sequel.pg_array_op(:sort_values)[1].desc(nulls: :last),
        Sequel.pg_array_op(:sort_values)[2],
        Sequel.pg_array_op(:sort_values)[3].desc,
        Sequel.pg_array_op(:sort_values)[4],
        :rank_prev_heat
      ]
    end

    def set_result result, update
      result ||= {}
      result.merge(update)
    end

    def set_atts array, value
      array[0] += 1
      array[1] += value
    end

    def set_sort_values result_jsonb
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
# puts Perseus::LANStorageAPI.get_result_route(params).all
# puts Perseus::LANStorageAPI.delete_route(wet_id: 0)
# puts Perseus::LANStorageAPI.delete_person(99,1030)
# puts Perseus::LANStorageAPI.get_result(wet_id: 99, route: 2, grp_id: 5).all

# params = { wet_id: 99,
#            grp_id: 5,
#            route: 2,
#            per_id: 1030,
#            result_jsonb: { 'p2' => { 'a' => 2, 'b' => 1, "t" => 2 }}
# }
# Perseus::LANStorageAPI.set_result_single(params)
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
# Perseus::LANStorageAPI.delete_results(wet_id: 1572)

# Check insert_registrants
# competitors = [{ 'PerId' => 1_000_000, 'lastname' => 'ruby' }]
# Perseus::LANStorageAPI.insert_registrants(competitors)

# hash =  { "test" => 1, "result_jsonb" => { "p1" => { "a" => 1, "b" => 1 }} }
# hash.keys.each { |key| hash[key.to_sym] = hash.delete(key) }
# puts hash
