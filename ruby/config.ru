require 'sinatra/base'
require 'rack/contrib'

Dir.glob('./{helpers,controllers}/*.rb').each { |file| require file }

# Rack options
#\ --host 0.0.0.0 
use Rack::PostBodyContentTypeParser

#run Perseus::App
map('/competition') { run Perseus::CompetitionController }
map('/results')     { run Perseus::ResultsController }
map('/')            { run Perseus::ApplicationController }

map('/statistics')  { run Perseus::StatisticsController }
map('/registration'){ run Perseus::RegistrationController }