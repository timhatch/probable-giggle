# Module  Perseus                 - The namespace for all application code
# Class   RegistrationController  - Subclasses ApplicationController
#
# RegistrationController  manages interactions creating/updating/deleting competitor data

module Perseus
  class RegistrationController < Perseus::ApplicationController

    # symbolize route parameters (deliberately non-recursive)
    before do
      params.keys.each { |k| params[k.to_sym] = params.delete(k) }
    end

    get '/test' do
      [200, {body: 'success'}.to_json]
    end

    # Register a list of athletes for a specific competition from a JSON formatted file
    post '/comp' do
      return 501 unless params[:file]

      data     = params[:file][:tempfile].read
  
      athletes = JSON.parse(data, symbolize_names: true)

      athletes.each.with_index(1) do |athlete, index|
        person = Perseus::LocalDBConnection::Competitors.insert_single(athlete)
        person[:start_order] = index unless athlete.include?(:start_order)
        Perseus::LocalDBConnection::Startlist.insert_single(athlete.merge(person))
      end
      [200, {body: "registered #{athletes.count} athletes"}.to_json]
    rescue KeyError, StandardError => error
      [500, {body: error.message}.to_json]
    end

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
  end
end
