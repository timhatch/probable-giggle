# frozen_string_literal: true

# Module  Perseus                 - The namespace for all application code
# Class   RegistrationController  - Subclasses ApplicationController
#
# RegistrationController  manages interactions creating/updating/deleting competitor data

module Perseus
  class RegistrationController < Perseus::ApplicationController
    # NOTE: sinatra uses indifferent hashes, so in theory has symbol and string keys
    # before do
    #   params.keys.each { |k| params[k.to_sym] = params.delete(k) }
    # end
    def startlist_info?(person)
      Perseus::LocalDBConnection::Startlist.required_values?(person)
      true
    rescue KeyError
      false
    end

    # Register an athlete, and return the athlete data with the relevant per_id added
    def register(athlete, index)
      start_order = athlete.include?(:start_order) ? athlete[:start_order] : index

      Perseus::LocalDBConnection::Competitors
        .insert_single(athlete)
        .merge(athlete, start_order: start_order)
    end

    # Register a list of athletes for a specific competition from a JSON formatted file
    post '/comp' do
      return 501 unless params[:file]

      data = params[:file][:tempfile].read

      athletes = JSON.parse(data, symbolize_names: true)
      athletes.each.with_index(1) do |athlete, index|
        person = register(athlete, index)
        # If startlist data is included, then add the relevant information
        Perseus::LocalDBConnection::Startlist.insert_single(person) if startlist_info?(person)
      end
      [200, { body: "registered #{athletes.count} athletes" }.to_json]
    rescue KeyError => e
      [500, { body: e.message }.to_json]
    rescue StandardError => e
      [500, { body: e.message }.to_json]
    end
  end
end

# rubocop:disable Style/BlockComments
=begin
    # Fetch a list of climbers from eGroupware (actually fetches the list of climbers registered
    # for a specific competition.
    # @params
    # - wet_id
    # This method simply passes the require parameters to the EGroupwarePublicAPI.get_starters
    # method for validation and action
    post '/ifsc' do
      404
      # data = Perseus::EGroupwarePublicAPI.get_starters(params)
      # Perseus::LocalDBConnection::Competitors.insert(data) ? 200 : 501
    end

    # Receive a json-encoded list of climbers and insert_or_ignore into the database
    # params[:data] - json encoded array of climber objects
    post '/json' do
      404
      # data = JSON.parse(params[:data], symbolize_names: true)
      # Perseus::LocalDBConnection::Competitors.insert(data) ? 200 : 501
    end
=end
# rubocop:enable Style/BlockComments
