
# Module  Perseus                 - The namespace for all application code
# Module  ResultsHandler          - Helper methods to handle resultss
#
require 'httparty'
require 'json'
require 'date'

# NOTE: require_relative statements are needed for stand-alone testing
# NOTE: To test event streams, we'll can use curl
#   curl -v --request GET -H "Accept: text/event-stream" http://10.0.2.10/broadcast/result
#   sets up a terminal based event source receiver connected to the test server. Bonjour /
#   zeroconf is not reliable
#   We can send test messages using either curl, httpie or httpary:
#   (curl)      curl -v http://10.0.2.10/broadcast/stream --data 'hello tim'
#   (httpie)    http POST http://10.0.2.10/broadcast/result message='hello tim'
#   (httparty)  httparty http://10.0.2.10/broadast/result --action POST --data "hello again"

module Perseus
  module ResultsHandler
    # Localhost receiver
    @default_url = 'http://127.0.0.1'

    private_class_method

    # Broadcast a result to localhost
    def self.broadcast_to_localhost path, data
      url     = @default_url + path
      options = { body: data.to_json }
      # HTTParty.post(url, options)
    rescue StandardError
      puts 'Exception raised in ResultsHandler.broadcast_to_localhost'
      nil
    end

    # Broadcast the received result to eGroupware
    # We use the presence of an authorisation key in the session parameters to determine
    # whether or not to send a message to eGroupware
    def self.broadcast_to_egroupware data
      # auth = LocalDBConnection::Session.get[:auth]
      # EGroupwarePrivateAPI.ranking_boulder_measurement(auth, data) unless auth.nil?
    rescue StandardError
      puts 'Exception raised in ResultsHandler.broadcast_to_egroupware'
      nil
    end

    module_function

    # Broadcast route results to localhost
    # FIXME: This is only going to work if the parameters passed in retrive route results...
    #        i.e. not individual results
    def broadcast_route params
      results = Perseus::LocalDBConnection::Results.fetch(params)
      Thread.new { broadcast_to_localhost('/broadcast/result', results) }
    end

    # Broadcast a single result to localhost and to eGroupware
    def broadcast_person params
      result = Perseus::LocalDBConnection::Results
               .fetch(params)
               .select { |x| x[:per_id] == params[:per_id] }
               .first
               .merge(result_jsonb: params[:result_jsonb])
      # Use the endpoint /broadcast/stream for the live output stream
      Thread.new { broadcast_to_localhost('/broadcast/stream', result) }
      Thread.new { broadcast_to_egroupware(params) }
    end

    # Broadcast results to localhost and egroupware
    # HACK: We contain each broadcast message within a separate thread in order to avoid to
    #   mitigate any network latency effects. This should in theory be unnecessary for broadcasts
    #   to localhost but on the other hand, if such broadcasts have little or no latency then
    #   the relevant threads will be short lived.
    # FIXME: Conceptually obsolete - broadcast_route and broadcast_person replace this...
    # FIXME: This is only going to work if the parameters passed in retrive route results...
    #        i.e. not individual results
    def broadcast_results params
      # return 0 unless Perseus::LocalDBConnection::Results.fetch(params).first
      # Fetch and broadcast the route result
      updated_route_result = Perseus::LocalDBConnection::Results.fetch(params)
      Thread.new { broadcast_to_localhost('/broadcast/result', updated_route_result) }
      # Fetch and broadcast the updated individual result
      # NOTE: Replace the general result_jsonb retrieved from the DB
      updated_person_result = updated_route_result
                              .select { |x| x[:per_id] == params[:per_id] }
                              .first
                              .merge(result_jsonb: params[:result_jsonb])
      Thread.new { broadcast_to_localhost('/broadcast/stream', updated_person_result) }
      Thread.new { broadcast_to_egroupware(params) }
    end

    # Purge the eventstream e.g. following a change of round
    def purge_eventstream
      HTTParty.delete(@default_url + '/broadcast/result')
      HTTParty.delete(@default_url + '/broadcast/stream')
    end
  end
end
