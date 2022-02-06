# Module  Perseus                 - The namespace for all application code
# Class   RegistrationController  - Subclasses ApplicationController
#
# RegistrationController  manages interactions creating/updating/deleting competitor data

module Perseus
  class RegistrationController < Perseus::ApplicationController
    # Add to the list of registered climbers by reading from a CSV formatted file
    # Assume that the CSV file contains the following data:
    # per_id, lastname, firstname, club (federation), nation, birthyear
    # @params
    # - a csv file
    # REVIEW: This function not yet tested
    post '/file' do
      # data = Perseus::CSVParser.parse_csv_file(file: params.delete(:file))
      # Perseus::LocalDBConnection::Competitors.insert(data) ? 200 : 501
    end

    # Fetch a list of climbers from eGroupware (actually fetches the list of climbers registered
    # for a specific competition.
    # @params
    # - wet_id
    # This method simply passes the require parameters to the EGroupwarePublicAPI.get_starters
    # method for validation and action
    post '/ifsc' do
      data = Perseus::EGroupwarePublicAPI.get_starters(params)
      # Perseus::LocalDBConnection::Competitors.insert(data) ? 200 : 501
    end

    # Receive a json-encoded list of climbers and insert_or_ignore into the database
    # params[:data] - json encoded array of climber objects
    post '/json' do
      data = JSON.parse(params[:data], symbolize_names: true)
      Perseus::LocalDBConnection::Competitors.insert(data) ? 200 : 501
    end
  end
end
