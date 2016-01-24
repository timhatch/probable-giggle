#require 'sinatra/base'
#require 'tilt/haml'
#require 'csv'
require 'sequel'
require 'pg'
require 'json'

module Perseus
  class ApplicationController < Sinatra::Base
    # Common helper functions
    # helpers Perseus::Helpers
   
    # All sub-classes inherit this common database reference
    # Use the array extensions to Postgresql
    DB = Sequel.connect(ENV['DATABASE_URL'] || "postgres://timhatch@localhost:5432/test")
    DB.extension :pg_array
    
    # Set the path to views, public, etc.
    set :views, File.expand_path('../../views', __FILE__)
    set :public_folder, File.expand_path('../../public', __FILE__)
    
    # Keep this page-route here for the time being
    get '/nexus' do
      haml :nexus
    end

  end
end


