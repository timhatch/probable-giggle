# Module  Perseus                 - The namespace for all application code
# Module  EGroupwarePublicAPI     - Helper functions to access the eGroupware Public API
# Module  EGroupwarePrivateAPI    - Helper functions to access the eGroupware Private API
#
require 'httparty'
require 'json'
require 'date'

#
# PUBLIC API
#
module Perseus
  # EGroupwarePublicAPI - Helper functions to access the eGroupware Public API
  module EGroupwarePublicAPI
    # private_class_method
    module_function

    # API Accessor
    # Interrogate EGroupware using the JSON API, Aborting if the site cannot be accessed or the
    # server returns a null response
    # Returns a JSON object (with keys represented as strings not symbols)
    # @params - Hash object containing variables (see the EGroupware API reference for options
    #
    def _get_json args
      url = 'http://egw.ifsc-climbing.org/egw/ranking/json.php'
      begin
        response = HTTParty.get(url, query: args)
        response.code == 200 ? JSON.parse(response.body) : nil
      rescue
        puts 'Exception raised in EGroupwarePublicAPI:get_json'
        nil # abort e.to_s
      end
    end

    # module_function

    # Fetch the list of competitors/team officials registered for the competition
    # Use a default value for grpid (to return the full dataset if no category is supplied)
    def get_starters wetid=0, grpid=0
      data = _get_json(comp: wetid, type: 'starters')
      unless data.nil? 
        if grpid > 0
          data['athletes'].select! { |x| x['cat'].to_i == grpid }
        else
          data['athletes']
        end
      end
    end

    # Fetch the startlist/resultslist for a given round
    # (gives the general result is route = -1030)
    def get_results wetid=0, grpid=0, route=-1
      data = _get_json(comp: wetid, cat: grpid, route: route)
      data['participants'] unless data.nil?
    end
  end
end

#
# PRIVATE API
#
module Perseus
  # EGroupwarePrivateAPI - Helper functions to access the eGroupware Private API
  module EGroupwarePrivateAPI
    # private_class_method
    module_function

    # Helper function to format a data object containing a single boulder result for eGroupware
    #
    # Takes the params posted to the local system and translates them into the data format
    # expected by the eGroupware "ranking.ranking_boulder_measurement.ajax_protocol_update" API
    #
    # @params - a hash formetted as follows:
    # { "wet_id" => 99,"grp_id" => 5,"route" => 2,"per_id" => 6326,
    #   "result_jsonb" => {
    #     "p2"=>{"a" => 4,"b" => 2,"t" => nil
    #   }
    # }}
    #
    # The data format expected by the eGroupware API is:
    # { request: {
    #   parameters: [{
    #     WetId: 99, GrpId: 5, route: 0, PerId: 1030,
    #     boulder: 1, try: 1, bonus: 1, top: "",
    #     updated: DateTime.now.new_offset(Rational(0,24)).to_s
    #   }]
    # }}
    #
    # NOTE: This format is from a PRIVATE API, so it could change
    # NOTE: Although parameters is expressed as an array contianing an object, the API does not
    #       seem to use this for inputing multiple sets of results, so assume here that it is
    #       only used to provide a single result
    # NOTE: The native JSON feed into eGroupware treats all values as strings rather than integers
    #       or nulls (so a "" is provided in place of a null) however it seems to accept both
    #       integers and nulls in testing
    # TODO: Check all hash parameters - think these need all to be converted to symbols
    #
    def compose_boulder_measurement_data params
      result = params.delete('result_jsonb')
      data   = capitalize_params(params)
               .merge(flatten_results(result))
               .merge('updated' => DateTime.now.new_offset(Rational(0, 24)).to_s)
      Hash['request' => { 'parameters' => [data] }]
    end

    # Wet_id, grp_id, per_id parameters need to be converted to CamelCase
    def capitalize_params params
      route = params.delete('route')
      Hash[params.map { |k, v| [k.split('_').map(&:capitalize).join, v] }]
        .merge('route' => route)
    end

    # eGroupware requires results in a flattened format
    def flatten_results result
      mapping = { 'a' => 'try', 'b' => 'bonus', 't' => 'top' }
      key = result.keys.first
      Hash[result[key].map { |k, v| [mapping[k], v] }]
        .merge('boulder' => key[1..-1].to_i)
    end

    # Helper function to format a data object containing results for a complete round (for one
    # climber) for uploading to eGroupware
    #
    # The data format expected by the eGroupware API is:
    # data = { "request": {
    #   "parameters": [
    #     { "WetId": "1572", "GrpId": "284", "route_order": "0" },
    #     "61104",
    #     {
    #       "checked": "",
    #       "zone1": "1", "top1": "",
    #       "zone2": "1", "top2": "",
    #       "zone3": "",  "top3": "",
    #       "zone4": "",  "top4": "",
    #       "zone5": "",  "top5": ""
    #     },
    #     false
    #   ]
    # }}
    # NOTE: This format is from a PRIVATE API, so it could change
    # TODO: Define this
    #
    def componse_result_ui_data
      puts 'Not Yet Implemented'
    end

    # module_function

    # API Accessor
    # Publish data to the ranking.ranking_boulder_measurement.ajax_protocol_update API point
    # (submits data for a single climber / single boulder)
    # See compose_boulder_measurement_data for @params
    # @params - authorisation, typically a hash containing either basic authorisation or
    #           sessionid credentials:
    #           auth = { 'Cookie' => 'sessionid=qo5tji64a1cvobtkddnjktlth0' }
    #           auth = { 'Authorization' => 'Basic dGltOm1vY2twbzIwMTQ=' }
    #           To produce a has from the login/password combination we need to require
    #           'base64' and
    #           Base64.strict_encode 'tim:mockpo2014'
    #         - See compose_boulder_measurement_data for the format of the result parameter
    #
    def ranking_boulder_measurement authorisation, result
      url  = 'https://ifsc.egroupware.net/egw/json.php'
      data = compose_boulder_measurement_data(result)
      begin
        options = Hash[
          query: { menuaction: 'ranking.ranking_boulder_measurement.ajax_protocol_update',
                   json_data: JSON.generate(data) },
          headers: authorisation]
        HTTParty.post(url, options)
      rescue
        puts 'Exception raised in EGroupwarePrivateAPI:set_boulder_result'
      end
    end

    # API Accessor
    # Publish data to the ranking.ranking_result_ui.ajax_update API point
    # (submits data for a single competitor / multiple boulders)
    #
    def ranking_result_ui authorisation, result
      url  = 'https://ifsc.egroupware.net/egw/json.php'
      data = componse_result_ui_data(result)
      begin
        options = Hash[
          query: { menuaction: 'ranking.ranking_result_ui.ajax_update',
                   json_data: JSON.generate(data) },
          headers: authorisation]
        HTTParty.post(url, options)
      rescue
        puts 'Exception raised in EGroupwarePrivateAPI:set_person_result'
      end
    end
  end
end

# params = {
#   "wet_id"=>99,"grp_id"=>5,"route"=>2,"per_id"=>6326,
#   "result_jsonb"=>{"p2"=>{"a"=>4,"b"=>2,"t"=>nil}}
# }

#puts Perseus::EGroupwarePublicAPI.get_starters(5759,81)
#puts Perseus::EGroupwarePublicAPI.get_results(5759, 81, 2)
