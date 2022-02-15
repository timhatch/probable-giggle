# frozen_string_literal: true

# Module  Perseus                 - The namespace for all application code
# Class   StartlistController     - Subclasses ApplicationController
#
# StartlistController manages interactions creating/updating/deleting startlist data
# Currently implements:
# - A Setter to import a new startlist from a formatted UTF-8 JSON file

module Perseus
  class StartlistController < Perseus::ApplicationController
    ALLOWED = %i[wet_id route grp_id per_id bib_nr start_order rank_prev_heat].freeze

    # NOTE: sinatra uses indifferent hashes, so in theory has symbol and string keys
    # before do
    #   params.keys.each { |k| params[k.to_sym] = params.delete(k) }
    # end

    # ROUTES
    # Receive a json-encoded list of climbers and insert_or_ignore into the database
    post '/file' do
      return 501 unless params[:file]

      data = params[:file][:tempfile].read
      list = JSON.parse(data, symbolize_names: true).map { _1.slice(*ALLOWED) }

      Perseus::LocalDBConnection::Startlist.insert_many(list) ? 200 : 500
      # DEBUG: TEST RESPONSE
      # [200, {body: starters}.to_json]
    rescue StandardError => e
      [500, { body: e.message }.to_json]
    end
  end
end

# rubocop:disable Style/BlockComments
=begin
    #
    # Create a startlist from the results of the current round
    # TODO: Re-architect this as it has to be able to deal with:
    # - 2 start groups,
    # - Importing list of starters from eGroupware (see RegistrationController, which at the moment
    #   simply checks that the relevant peopple are in the database
    # @params = { wet_id: int, grp_id: int, route: int }
    #
    post '/new' do
      # Perseus::LocalDBConnection::Startlist.generate(params) ? 200 : 501
      404
    end

    # Import a startlist for some given competition/category/round from eGroupware
    # @params = { wet_id: int, grp_id: int, route: int }
    post '/ifsc' do
      # NOTE: Deactiviate eGroupware interface
      # params[:competitors] = Perseus::EGroupwarePublicAPI.get_results(params)
      # Perseus::LocalDBConnection::Startlist.insert(params) ? 200 : 501
      404
    end

    post '/json' do
      404
      # data = JSON.parse(params[:data], symbolize_names: true)
      # Perseus::LocalDBConnection::Startlist.insert(data) ? 200 : 501
    end
=end
# rubocop:enable Style/BlockComments
