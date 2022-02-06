# Module  Perseus                 - The namespace for all application code
# Module  EGroupwarePrivateAPI    - Helper functions to access the eGroupware Private API
#
require 'httparty'
require 'json'
require 'date'

#
# PRIVATE API
#
module Perseus
  # EGroupwarePrivateAPI - Helper functions to access the eGroupware Private API
  module EGroupwarePrivateAPI
    private_class_method

    # Wet_id, grp_id, per_id parameters need to be converted to CamelCase
    def self.capitalize_params params
      route = params.delete('route')
      Hash[params.map { |k, v| [k.split('_').map(&:capitalize).join, v] }]
        .merge('route' => route)
    end

    # eGroupware requires results in a flattened format
    def self.flatten_results result
      mapping = { 'a' => 'try', 'b' => 'bonus', 't' => 'top' }
      key = result.keys.first
      Hash[result[key].map { |k, v| [mapping[k], v] }]
        .merge('boulder' => key[1..-1].to_i)
    end

    # Helper function to format a data object containing a single boulder result for eGroupware
    #
    # Takes the params posted to the local system and translates them into the data format
    # expected by the eGroupware "ranking.ranking_boulder_measurement.ajax_protocol_update" API
    #
    # @params - a hash formetted as follows:
    # { wet_id: 99, grp_id: 5, route: 2, per_id: 6326,
    #   result_jsonb: {
    #     "p2" => { "a" => 4,"b" => 2,"t" => nil }
    #   }
    # }
    #
    # The data format expected by the eGroupware API is a JSON formatted object created from a
    # hash having the format:
    # { 'request' => {
    #   'parameters' => [{
    #     'WetId' => 99, 'GrpId' => 5, 'route' => 0, 'PerId' => 1030,
    #     'boulder' => 1, 'try' => 1, 'bonus' => 1, 'top' => "",
    #     'updated' => DateTime.now.new_offset(Rational(0,24)).to_s
    #   }]
    # }}
    #
    # NOTE: This format is from a PRIVATE API, so it could change
    # NOTE: Although parameters is expressed as an array contianing an object, the API does not
    #       seem to use this for inputing multiple sets of results, so assume here that it is
    #       only used to provide a single result
    # NOTE: The native JSON feed into eGroupware treats all values as strings rather than integers
    #       or nulls (so a "" is provided in place of a null) however it seems to accept both
    #       integers and nulls in testing. It also seems to accept missing parameters, e.g. the
    #       following entries are all treated as the same:
    #         'boulder' => 1, 'try' => 1, 'bonus' => 1, 'top' => ""
    #         'boulder' => 1, 'try' => 1, 'bonus' => 1, 'top' => null
    #         'boulder' => 1, 'try' => 1, 'bonus' => 1
    # NOTE: The input parameters are stringified because we need to manipulate case (eGroupware
    #       uses CamelCase for most (but not all input parameters) where our symbols are all
    #       snake_case
    def self.compose_boulder_measurement_data params
      params.keys.each { |k| params[k.to_s] = params.delete(k) }
      result = params.delete('result_jsonb')
      data   = capitalize_params(params)
               .merge(flatten_results(result))
               .merge('updated' => DateTime.now.new_offset(Rational(0, 24)).to_s)
      Hash['request' => { 'parameters' => [data] }]
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
    # NOTE: 61104 above appears to be the PerId value
    # NOTE: This format is from a PRIVATE API, so it could change
    # TODO: Define this
    #
    def self.compose_result_ui_data
      puts 'Not Implemented'
    end

    module_function

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
    # HACK: Hardwire session authorisation. The sessionid key is stored as plain text
    #   and basic authorisation is not implemented. Will have to rethink this if both types (or
    #   a different type of) authorisation are/is needed
    #   NOTE: See note at the foot of this fie
    def ranking_boulder_measurement authorisation, result
      url  = 'https://ifsc.egroupware.net/egw/json.php'
      auth = { 'Cookie' => authorisation }
      data = compose_boulder_measurement_data(result)
      begin
        options = Hash[
          query: { menuaction: 'ranking.ranking_boulder_measurement.ajax_protocol_update',
                   json_data: JSON.generate(data) },
          headers: auth]
        HTTParty.post(url, options)
      rescue
        puts 'Exception raised in EGroupwarePrivateAPI:ranking_boulder_measurement'
        nil
      end
    end

    # API Accessor
    # Publish data to the ranking.ranking_result_ui.ajax_update API point
    # (submits data for a single competitor / multiple boulders)
    # HACK: NOT COMPLETE / TESTED. DO NOT USE.
    def ranking_result_ui authorisation, result
      puts 'Not Implemented'
      # url  = 'https://ifsc.egroupware.net/egw/json.php'
      # auth = { 'Cookie' => authorisation }
      # data = compose_result_ui_data(result)
      # begin
      #   options = Hash[
      #     query: { menuaction: 'ranking.ranking_result_ui.ajax_update',
      #              json_data: JSON.generate(data) },
      #     headers: auth]
      #   HTTParty.post(url, options)
      # rescue
      #   puts 'Exception raised in EGroupwarePrivateAPI:ranking_result_ui'
      #   nil
      # end
    end
  end
end

# data = {
#   "wet_id"=>1572,"grp_id"=>284,"route"=>0,"per_id"=>50691,
#   "result_jsonb"=>{"p2"=>{"a"=>4,"b"=>2,"t"=>nil}}
# }
# Perseus::EGroupwarePrivateAPI.ranking_boulder_measurement('cq5glcnacdpsa5ahih6jqb3qr1', data)
# puts Perseus::EGroupwarePublicAPI.get_results(wet_id: 1572, grp_id: 284, route: 0)
