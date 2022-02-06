# Module  Perseus                 - The namespace for all application code
# Module  LocalDBConnection       - Helper methods to access the LAN database
# Module  Competitors             - Competitors creation methods
#
require 'sequel'
require 'pg'
require 'json'

# Competitor related getters/setters
# OPTIMIZE: Replace the explicit assignment in insert() by a shorthand conversion of the parameters
#   hash passed into the function (as in other sub-modules).
#   anticipation..
module Perseus
  module LocalDBConnection
    module Competitors
      # Notionally private methods
      private_class_method

      module_function

      # Helper method to import competitors into the local database
      # We assume that the competitors parameter is an array of hash objects, each object
      # containing some or all of the following parameters:
      # per_id, lastname, firstname, club, nation, birthyear, gender
      # TODO: Add error checking
      # NOTE: This method deliberately will not overwrite any existing competitor
      # HACK: If using Postgres 9.5, could try insert_conflict.insert(args)
      #
      def insert competitors
        competitors.each do |person|
          record = DB[:Climbers].where(per_id: person[:per_id])
          next if record.first

          record.insert(person)
        end
      end
    end
  end
end
