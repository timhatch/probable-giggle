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

      def self.query person
        person['per_id'] = person['PerId'] unless person['PerId'].nil?
        DB[:Climbers].where(per_id: person['per_id'].to_i)
      end

      module_function

      # Helper method to import competitors into the local database
      # We assume that the competitors parameter is an array of hash objects, each object
      # containing the following parameters:
      # per_id, lastname, firstname, federation, nation, birthyear
      # NOTE: This method deliberately will not overwrite any existing competitor
      # HACK: If using Postgres 9.5, could try insert_conflict.insert(args)
      # NOTE: The hash contents are assumed to be STRING (NOT SYMBOL) based. This works for the
      #       eGroupware response and for headed CSV files
      #
      def insert competitors
        competitors.each do |person|
          record = query(person)
          next if record.first
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
