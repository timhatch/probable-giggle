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
          rank_prev_heat: person['rank_prev_heat'].to_i
        )
      end

      module_function

      # Helper method to import a startlist into the LAN database
      #
      # The data is assumed to ne an array competitors, each a ruby Hash containing at least
      # a per_id (or PerId) and start_order parameter
      #
      # @params
      # - A hash containing:
      # - :wet_id, :grp_id, :route (each integers) defining the comp, category and round
      # - :competitors  An array of competitor data, each competitor having three properties
      #   'PerId' or 'per_id' (the Competitor's id), start_order and (optional) rank_prev_heat
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
