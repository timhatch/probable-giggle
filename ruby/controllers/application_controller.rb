# Module  Perseus                 - The namespace for all application code
# Class   ApplicationController   - Base class for all route controllers
#
# ApplicationController sets the path to views, static assets etc for all sub-classes, manages
# the root URL, none of which are used in the current implementation.
# The only practical matter dealt with here is the establishment of a database connection
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
    get '/test' do
      [200, { body: 'string' }.to_json]
    end
  end
end
