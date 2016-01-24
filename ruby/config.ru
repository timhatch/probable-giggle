require 'sinatra/base'
require 'rack/contrib'


Dir.glob('./{helpers,controllers}/*.rb').each { |file| require file }

# Rack options
#\ --host 0.0.0.0 
use Rack::PostBodyContentTypeParser

#run Perseus::App
map('/competition') { run Perseus::CompetitionController }
map('/climber')     { run Perseus::ClimberController }
map('/')            { run Perseus::ApplicationController }