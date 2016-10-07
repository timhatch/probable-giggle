# Module  Perseus                 - The namespace for all application code
# Class   EventController         - Subclasses ApplicationController
# 
# EventController implements a simple server side event emitter: 
# Run this like so: curl -s -H "Accept: text/event-stream" http://0.0.0.0:9292
#
require 'sinatra/sse'

# 
module Perseus
  class EventController < Perseus::ApplicationController
    include Sinatra::SSE

    connections = []
    
    # Handle "receiver" connections
    get '/' do
      sse_stream do |out|
        connections.push out
      end
    end
    
    # Handle "transmitter" connections
    post '/' do
      # TODO: Need to handle all data processing here, updates to POSTGRES etc.
      results = params.merge(timestamp: Time.now.to_s).to_json
      connections.each { |out| out.push data: results }
      puts 204 
    end
   
    # Handle the entry page - note that this is not a streaming connection
    get '/display' do
      haml :events
    end
  end
end

