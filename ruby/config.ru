require 'rack/contrib'

require './myapp'
#require './helpers'

# Rack options
#\ --host 0.0.0.0 
use Rack::PostBodyContentTypeParser

run Perseus::App
