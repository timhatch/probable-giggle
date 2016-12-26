# Module  Perseus                 - The namespace for all application code
# Module  LANStorageAPI           - Helper functions to access the LAN database
#
require 'sequel'
require 'pg'
require 'json'

module Perseus
  # LANStorageAPI
  module LANStorageAPI
    # Instantiate database access
    DB = Sequel.connect(ENV['DATABASE_URL'] || "postgres://timhatch@localhost:5432/test")
    DB.extension :pg_array, :pg_json  # Needed to insert arrays
    Sequel.extension :pg_array_ops    # Needed to query stored arrays
    Sequel.extension :pg_json
    
    module_function

    def delete_competition params
      DB[:Competitions].where(params).delete
    end

    def delete_results params
      DB[:Results].where(params).delete
    end
    
    # Helper method to import competitors into the local database
    #
    # The "replace" operator is not supported for postgres databases, so use a workaround like so
    #
    def insert_registrants competitors
      competitors.each do |person|
        person['per_id'] = person['PerId'] unless person['PerId'].nil?
        record = DB[:Climbers].where(per_id: person['per_id'].to_i)
        record.insert(
          per_id:    person['per_id'].to_i,
          lastname:  person['lastname'],
          firstname: person['firstname'],
          club:      person['federation'],
          nation:    person['nation'],
          birthyear: person['birthyear'].to_i
        ) unless record.first
      end
      200
    end
        
    # Helper method to import a startlist into the LAN database
    #
    # The data is assumed to ne an array competitors, each a ruby Hash containing at least
    # a per_id (or PerId) and start_order parameter
    #
    def insert_startlist wetid=0, grpid=0, route=0, competitors
      # delete any existing results data for the rounf
      delete_results(wet_id: wetid, grp_id: grpid, route: route)
      # Load the starters, converting any 'PerId' parameter (e.g. from eGroupware) into the snake_case
      # format expected here
      competitors.each do |person|
        person['per_id'] = person['PerId'] unless person['PerId'].nil?
        DB[:Results].insert(
          wet_id: wetid, grp_id: grpid, route: route,
          per_id: person['per_id'].to_i, 
          start_order:    person['start_order'].to_i,
          rank_prev_heat: person['rank_prev_heat'].to_i
        )
      end
      200
    end
  end
end

#Perseus::LANStorageAPI.delete_route(wet_id: 0)
#Perseus::LANStorageAPI.delete_competition(21)
#Perseus::LANStorageAPI.delete_person(99,1030)
