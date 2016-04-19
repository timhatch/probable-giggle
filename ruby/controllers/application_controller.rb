# Module  Perseus                 - The namespace for all application code
# Class   ApplicationController   - Base class for all route controllers
# 
# ApplicationController sets the path to views, static assets etc for all sub-classes and manages
# the root URL
# Currently implements only a route to the base URL
#
require 'sequel'
require 'pg'
require 'json'

module Perseus
  class ApplicationController < Sinatra::Base
   
    # All sub-classes inherit this common database reference
    #
    DB = Sequel.connect(ENV['DATABASE_URL'] || "postgres://timhatch@localhost:5432/test")
    DB.extension :pg_array          # Needed to insert arrays
    Sequel.extension :pg_array_ops  # Needed to query stored arrays
    
    # Set the path to views, public, etc.
    #
    set :views, File.expand_path('../../views', __FILE__)
    set :public_folder, File.expand_path('../../public', __FILE__)
    
    # Handle the application's root view
    # 
    get '/' do
      haml :index
    end
  end
end
