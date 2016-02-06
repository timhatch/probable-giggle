# Handlers for '/registration' routes 
#

module Perseus
  class RegistrationController < ApplicationController
    # TODO: 
    def parse_csv_file params
      if params[:file]
        file    = params[:file][:tempfile]
        #data    = []
        # NOTE: header_converters downcases all headers...
        options = { headers: true, converters: :numeric }        
        CSV.foreach(file, options) do |row|
          person = Hash[row.to_hash.map{|(k,v)| [k.to_sym,v]}]
          # TODO
          #Startlist.set_starter person
        end
      else
        p 'no file'
      end
    end
    
    def insert_competitors params
    
    end
  
    def delete_competitors params
    
    end
  end
end

## Public: Route handling for the admin/registration page
##
## params - TODO: Add WetId and CompName as params
##
#get '/registration' do
#  # TODO Set these parameters based on earlier input. e.g. get values from a database 
#  @title = 'Test Comp'
#  @wetid = 1
#  haml :registration, :layout => :mithril
#end
#
#post '/registration' do
#  if params[:file]
#    file     = params[:file][:tempfile]
#    data     = []
#    # NOTE: header_converters downcases all headers...
##    csv_opts = { headers: true, converters: :numeric, header_converters: :symbol }
##    CSV.foreach(file, csv_opts) { |row| resp.push row.to_hash }
#    csv_opts = { headers: true, converters: :numeric }
##    CSV.foreach(file, csv_opts) { |row| data.push Hash[row.to_hash.map{|(k,v)| [k.to_sym,v]}] }
##    Startlist.set_starters({ starters: data })
#    
#    CSV.foreach(file, csv_opts) do |row|
#      person = Hash[row.to_hash.map{|(k,v)| [k.to_sym,v]}]
#      Startlist.set_starter person
#    end
#  else
#    p 'No file provided'
#  end
#end
