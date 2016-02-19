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
    DB = Sequel.connect(ENV['DATABASE_URL'] || "postgres://timhatch@localhost:5432/test")
    DB.extension :pg_array          # Needed to insert arrays
    Sequel.extension :pg_array_ops  # Needed to query stored arrays
    
    # Set the path to views, public, etc.
    set :views, File.expand_path('../../views', __FILE__)
    set :public_folder, File.expand_path('../../public', __FILE__)
    
    # EGroupware interface
    get '/egw' do
      redirect '/ifsc_display/index.boulder.html'
    end
    
    get '/' do
      haml :index
    end
    
  end
end