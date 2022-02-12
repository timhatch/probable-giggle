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
      REQUIRED = [:firstname, :lastname, :birthyear, :gender, :nation]

      # Notionally private methods
      private_class_method

      module_function

      # NOTE: Raises KeyError if @person doesn't contain a required value
      def has_required_values?(person)
        person.fetch_values(*REQUIRED)
      end

      # Helper method to import a single competitor into the local database
      # @person is a hash with mandatory [optional] properties:
      # @person = :firstname, :lastname, :nation, :birthyear, :gender, [:club, :active]
      def insert_single(person)
        params = person.slice(:firstname, :lastname, :nation, :birthyear, :gender, :club)
        has_required_values?(params)

        record = DB[:Climbers].where(person.slice(*REQUIRED))
        # NOTE: If a record exists, return that and otherwise create (and return) a new record 
        record.first || DB[:Climbers].returning.insert(params).first 
      end

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
