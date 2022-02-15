# frozen_string_literal: true

# Module  Perseus                 - The namespace for all application code
# Module  LocalDBConnection       - Helper methods to access the LAN database
# Module  Startlist               - Startlist creation methods
#
require 'sequel'
require 'pg'
require 'json'

# Startlist data getter/setters
# REVIEW: To be checked
module Perseus
  module LocalDBConnection
    module Startlist
      REQUIRED = %i[wet_id grp_id route per_id].freeze

      # Notionally private methods
      # private_class_method

      module_function

      # NOTE: Raises KeyError if @person doesn't contain a required value
      def required_values?(person)
        person.fetch_values(*REQUIRED)
      end

      # @person is a hash with mandatory [optional] properties:
      # @person = :wet_id, :grp_id, :route, :per_id, [:start_order, :rank_prev_heat, ...]
      def insert_single(person)
        params = person.slice(:wet_id, :grp_id, :route, :per_id, :start_order, :rank_prev_heat)
        required_values?(params)

        record = DB[:Results].where(person.slice(*REQUIRED))
        # NOTE: If a record exists, return that and otherwise create (and return) a new record
        record.first || DB[:Results].returning.insert(params).first
      end

      # Helper method to import a startlist into the LAN database
      def insert_many(data)
        data.each { insert_single(_1) }
      end
    end
  end
end

# rubocop:disable Style/BlockComments
=begin
      # Simple startlist creator
      # @params
      # A hash containing
      # - :quota, defining the qualifying quota
      # - :wet_id, :grp_id, :route defining the comp, category and route FROM WHICH the
      #   startlist is to be generated
      # TODO: Deal with the special case of 2 starting groups
      # NOTE: We don't check the parameters here as that's done in methods we're calling
      #
      def generate params
        quota    = params[:quota].to_i || 1
        # Fetch an ordered list - for now this doesnt rely on the relevant results being locked or
        # having a 'final' rank
        starters = Perseus::LocalDBConnection::Results
                   .fetch(params)
                   .keep_if { |x| x[:result_rank] <= quota }
                   .reverse.map.with_index(1) { |x, i|
                     Hash[per_id: x[:per_id],
                          start_order: i,
                          rank_prev_heat: x[:rank_this_heat]]
                   }
        route = params.delete(:route).to_i + 1
        insert(params.merge(route: route, competitors: starters))
      end
=end
# rubocop:enable Style/BlockComments

# require_relative './localdb_accessors'
# require_relative './localdb_accessors_results'
# require_relative './ifsc_boulder_modus'
# Perseus::LocalDBConnection::Startlist.generate({ wet_id: 99, grp_id: 5, route: 2, quota: 2 })
