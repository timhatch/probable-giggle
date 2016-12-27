require 'sinatra/base'
require 'rack/contrib'

Dir.glob('./{helpers,controllers}/*.rb').each { |file| require file }

# Rack options
# \ --host 0.0.0.0
# Sinatra has a mare dealing with JSON encoded requests - Rack deals with this
use Rack::PostBodyContentTypeParser

# run Perseus::App
map('/')             { run Perseus::ApplicationController }
map('/competition')  { run Perseus::CompetitionController }
map('/results')      { run Perseus::ResultsController }

#map('/statistics')   { run Perseus::StatisticsController }
map('/registration') { run Perseus::RegistrationController }
map('/startlist')    { run Perseus::StartlistController }
map('/displays')     { run Perseus::DisplayController }

# Add a test controller to support Server-Side Events for real live updates
#map('/live')         { run Perseus::EventController }
