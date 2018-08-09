require 'sinatra/base'
require 'rack/contrib'

# Lazy load helpers (for some reason, the same doesn't work with controllers in 10.13/Homebrew ruby) 
Dir.glob('./{helpers}/*.rb').each { |file| require_relative file }

# Direct includes are required on OX 10.13 / ruby 2.5.1 (installed via homebrew)
# May be installation specific 
require_relative './controllers/application_controller.rb'
require_relative './controllers/results_controller.rb'
require_relative './controllers/startlist_controller.rb'
require_relative './controllers/session_controller.rb'

# Rack options
# \ --host 0.0.0.0
# Sinatra has a mare dealing with JSON encoded requests - Rack deals with this
use Rack::PostBodyContentTypeParser

# run Perseus::App
map('/')             { run Perseus::ApplicationController }
map('/results')      { run Perseus::ResultsController }
map('/startlist')    { run Perseus::StartlistController }
map('/session')      { run Perseus::SessionController }

# Redundant map (static content served via NGINX for now)
# map('/displays')     { run Perseus::DisplayController }
# Bespoke controller for handling the CWIF Qualification
# map('/cwif')         { run Perseus::CWIFController }
