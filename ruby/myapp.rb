require 'sinatra/base'
#require 'tilt/haml'
#require 'csv'
#require 'sequel'
#require 'pg'
#require 'json'


require './competition_controller'

module Perseus
  class App < Sinatra::Base
  # Use the configure block if we are running without a config.ru
  #  configure do
  #    use Rack::PostBodyContentTypeParser
  #    
  #    set :bind, '0.0.0.0'
  #  end

    DB = Sequel.connect(ENV['DATABASE_URL'] || "postgres://timhatch@localhost:5432/test")

    # The MyApp::Competition Module 
    register Perseus::CompetitionController
    register Perseus::ClimberController

  end
end


