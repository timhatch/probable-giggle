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
      REQUIRED = %i[firstname lastname birthyear gender nation].freeze

      # Notionally private methods
      # private_class_method

      module_function

      # NOTE: Raises KeyError if @person doesn't contain a required value
      def required_values?(person)
        person.fetch_values(*REQUIRED)
      end

      # Helper method to import a single competitor into the local database
      # @person is a hash with mandatory [optional] properties:
      # @person = :firstname, :lastname, :nation, :birthyear, :gender, [:club, :active]
      def insert_single(person)
        params = person.slice(:firstname, :lastname, :nation, :birthyear, :gender, :club)
        required_values?(params)

        record = DB[:Climbers].where(person.slice(*REQUIRED))
        # NOTE: If a record exists, return that and otherwise create (and return) a new record
        record.first || DB[:Climbers].returning.insert(params).first
      end
    end
  end
end

# rubocop:disable Style/BlockComments
=begin
      # Helper method to import competitors into the local database
      # We assume that the competitors parameter is an array of hash objects, each object
      # containing some or all of the following parameters:
      # per_id, lastname, firstname, club, nation, birthyear, gender
      # TODO: Add error checking
      # NOTE: This method deliberately will not overwrite any existing competitor
      # HACK: If using Postgres 9.5, could try insert_conflict.insert(args)
      #
      def insert_many competitors
        competitors.each { insert_single(_1) }
      end
=end
# rubocop:enable Style/BlockComments
