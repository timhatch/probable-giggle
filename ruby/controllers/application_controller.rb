# Module  Perseus                 - The namespace for all application code
# Class   ApplicationController   - Base class for all route controllers
#
# ApplicationController sets the path to views, static assets etc for all sub-classes and manages
# the root URL
# Currently implements only a route to the base URL
#
require 'sequel'
require 'pg'

module Perseus
  class ApplicationController < Sinatra::Base
    # Set the path to views, public, etc.
    # set :views, File.expand_path('../../views', __FILE__)
    # set :public_folder, File.expand_path('../../public', __FILE__)

    helpers Perseus::LocalDBConnection

    # Handle the application's root view
    #
    # get '/' do
    #   haml :index
    # end
  end
end
