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
    # Use the Server-Sent Event gem.
    # Difficulty being its not obvious how to broadcast events from an internal trigger
    include Sinatra::SSE

    connections   = []
    notifications = []

    def timestamp
      Time.now.strftime("%H:%M:%S")
    end
 
    get '/', provides: 'text/event-stream' do
      stream :keep_open do |out|
        connections << out
        # Send a keep-alive message to stop the link timing out
        # This is not strictly needed for a browser connection as most/all browsers will
        # reopen the connection when a new message is sent
        EM.add_periodic_timer(28) { out << "data: \n\n" }

        #out.callback on stream close evt. 
        out.callback { connections.delete(out) }
      end
    end

    # Simple post responder - here we just echo the received message to all active streaming connections
    post '/' do
      # Add s timestamp to the notification
      notification = params.merge( { 'connections' => connections.count, 'timestamp' => timestamp }).to_json
      notifications << notification
      # Retain only the last 10 notifications
      notifications.shift if notifications.length > 10
      
      connections.each { |out| out << "data: #{notification}\n\n"}
      puts params
    end
    
    active_connections = []

    get '/gem' do
      sse_stream do |out|
        active_connections.push out

        # EM.add_periodic_timer(1) do 
        #   out.push :event => 'timer', :data => Time.now.to_s
        # end
      end
    end

    post '/gem' do
      active_connections.each { |out| out.push :event => 'message', :data => params['message'] + ' ' + Time.now.to_s}
      puts params
    end

   
    get '/display' do
      haml :events
    end
  end
end

