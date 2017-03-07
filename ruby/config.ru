require 'sinatra/base'
require 'rack/contrib'

Dir.glob('./{helpers,controllers}/*.rb').each { |file| require file }

# Rack options
# \ --host 0.0.0.0
# Sinatra has a mare dealing with JSON encoded requests - Rack deals with this
use Rack::PostBodyContentTypeParser

# run Perseus::App
map('/')             { run Perseus::ApplicationController }
map('/results')      { run Perseus::ResultsController }
map('/registration') { run Perseus::RegistrationController }
map('/startlist')    { run Perseus::StartlistController }
map('/displays')     { run Perseus::DisplayController }
map('/session')      { run Perseus::SessionController }

# Bespoke controller for handling the CWIF Qualification
map('/cwif')         { run Perseus::CWIFController }
