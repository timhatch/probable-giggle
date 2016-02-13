# Handlers for '/registration' routes 
#
require 'csv'

module Perseus
  class RegistrationController < ApplicationController
    
    # Insert a single person into the database. 
    # required params: per_id
    # optional params: firstname, lastname, nation, gender, birthyear, club
    #   
    def insert_person person
      dataset = DB[:Climbers].where(per_id: person[:per_id])
      dataset.insert(person) unless dataset.first
    end  

    # Delete a single person from the database. 
    # required params: per_id
    # 
    def delete_person params
      DB[:Climbers].where(per_id: params[:per_id]).delete
    end
    
    # Parse a CSV file, converting each row into a "Person" object and inserting the provided
    # parameters into the database. The header row of the CSV file is used to set the relevant
    # parameters
    # required params: per_id
    # optional params: firstname, lastname, nation, gender, birthyear, club
    #   
    parse_csv_file = lambda do
      if params[:file]
        file    = params[:file][:tempfile]

        # TODO: Add content checking, we don't actually handle the case of an invalid file
        # NOTE: header_converters downcases all headers...
        CSV.foreach(file, { headers: true, converters: :numeric }) do |row|
          person = Hash[row.to_hash.map{|(k,v)| [k.to_sym,v]}]
          insert_person(person)
        end
      else
        p "no file"
      end
    end
    
    # Route handling
    #
    get '/' do
      haml :registration
    end
    
    post '/', &parse_csv_file
    
  end
end