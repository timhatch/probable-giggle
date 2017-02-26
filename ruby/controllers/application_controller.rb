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
require 'socket'

module Perseus
  class ApplicationController < Sinatra::Base
    # Set the path to views, public, etc.
    set :views, File.expand_path('../../views', __FILE__)
    set :public_folder, File.expand_path('../../public', __FILE__)

    helpers Perseus::LocalDBConnection

    # Handle the application's root view
    #
    get '/' do
      haml :index
    end

    # Get connection details for the local results server
    # See
    # http://stackoverflow.com/questions/42566/getting-the-hostname-or-ip-in-ruby-on-rails
    #
    get '/connection' do
      begin
        addr = Socket.ip_address_list.find { |ai| ai.ipv4? && !ai.ipv4_loopback? }.ip_address
      rescue
        addr = nil
      end
      Hash[hostname: Socket.gethostname, address: addr].to_json
    end

    # symbolize route paramaters (deliberately non-recursive)
    before do
      params.keys.each { |k| params[k.to_sym] = params.delete(k) }
    end

    get '/session' do
      LocalDBConnection::Session.data.to_json
    end

    post '/session/wet_id' do
      LocalDBConnection::Session.competition(params) ? 200 : 501
    end
    post '/session/auth' do
      LocalDBConnection::Session.authorisation(params) ? 200 : 501
    end
  end
end
