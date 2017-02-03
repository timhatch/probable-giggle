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
    private_class_method

    # API Accessor
    # Interrogate EGroupware using the JSON API, Aborting if the site cannot be accessed or the
    # server returns a null response
    # Returns a JSON object (with keys represented as strings not symbols)
    # @params - Hash object containing variables (see the EGroupware API reference for options
    #
    def self.get_json params
      url = 'http://egw.ifsc-climbing.org/egw/ranking/json.php'
      begin
        #  response = HTTParty.get(url, query: params, options: { timeout: 1 })
        response = HTTParty.get(url, query: params)
        response.code == 200 ? JSON.parse(response.body) : nil
      rescue
        puts 'Exception raised in EGroupwarePublicAPI:get_json'
        nil # abort e.to_s
      end
    end

    module_function

    # Fetch the list of competitors/team officials registered for the competition
    # Use a default value for grpid (to return the full dataset if no category is supplied)
    def get_starters params
      grpid = params[:grp_id].to_i || 0
      data  = get_json(comp: params[:wet_id].to_i || 0, type: 'starters')
      return if data.nil?
      if grpid > 0
        data['athletes'].select! { |x| x['cat'].to_i == grpid }
      else
        data['athletes']
      end
    end

    # Fetch the startlist/resultslist for a given round
    # (gives the general result is route = -1)
    def get_results params
      args = {
        comp: params[:wet_id].to_i || 0,
        cat:  params[:grp_id].to_i || 0,
        route: params[:route].to_i || -1
      }

      data = get_json(args)
      data['participants'] unless data.nil?
    end
  end
end

# puts Perseus::EGroupwarePublicAPI.get_starters(wet_id: 5759, grp_id: 81)
# puts Perseus::EGroupwarePublicAPI.get_results(wet_id: 5759, grp_id: 81, route: 2)
# puts Perseus::EGroupwarePublicAPI.get_starters(wet_id: 1572,  grp_id: 284)
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
      puts 'Not Yet Implemented'
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
      url  = 'https://ifsc.egroupware.net/egw/json.php'
      auth = { 'Cookie' => authorisation }
      data = compose_result_ui_data(result)
      begin
        options = Hash[
          query: { menuaction: 'ranking.ranking_result_ui.ajax_update',
                   json_data: JSON.generate(data) },
          headers: auth]
        HTTParty.post(url, options)
      rescue
        puts 'Exception raised in EGroupwarePrivateAPI:ranking_result_ui'
        nil
      end
    end
  end
end

# data = {
#   "wet_id"=>1572,"grp_id"=>284,"route"=>0,"per_id"=>50691,
#   "result_jsonb"=>{"p2"=>{"a"=>4,"b"=>2,"t"=>nil}}
# }
# Perseus::EGroupwarePrivateAPI.ranking_boulder_measurement('cq5glcnacdpsa5ahih6jqb3qr1', data)
# puts Perseus::EGroupwarePublicAPI.get_results(wet_id: 1572, grp_id: 284, route: 0)

# Test module - Updating results to eGroupware requires any POST message to be submitted with
# an authorisation cookie. As noted, these could be:
#   a) basic authorisation of a valid user; or
#   b) a sessionid
# The trouble is that eGroupware also etablishes a server-side session record. If a POST request
# doesn't have a correspoinding server-side session the basic result will be updated but
# eGroupware will be issue a SQL error when updating the ranking.
#
# This module includes a set of experiments to see if we can set the relevant server-side session
# variables
module Perseus
  # EGroupwarePrivateAPI - Helper functions to access the eGroupware Private API
  module EGroupwareSessionAPI
    private_class_method

    def self.compose_calendar server_session_id
      Hash['request' => {
        'parameters' => [
          server_session_id,
          {
            'nm' => { 'calendar' => 'XYZ' }
          },
          false
        ]
      }]
    end

    def self.compose_comp server_session_id
      Hash['request' => {
        'parameters' => [
          server_session_id,
          {
            'nm' => {
              'calendar' => 'XYZ',
              'comp' => '1572',
              'cat' => '284',
              'discipline' => 'boulder',
              'route_type' => '0'
            }
          },
          false
        ]
      }]
    end

    module_function

    # Login to eGroupware and fetch the sessionid parameter
    def login params
      url      = 'https://ifsc.egroupware.net/egw/login.php'
      defaults = { logindomain: 'ifsc-climbing.org', passwd_type: 'text', account_type: 'u' }
      begin
        HTTParty
          .post(url, body: defaults.merge(params))
          .request.options[:headers]['Cookie']
          .split(';')
          .select { |x| /sessionid=/.match(x) }
          .first
          .strip
      rescue
        puts 'Exception raised in EGroupwareSessionAPI.login'
        nil
      end
    end

    # Request the server-side session id
    def ajax_exec sessionid
      url  = 'https://ifsc.egroupware.net/egw/json.php'
      data = Hash['request' => { 'parameters' =>
        ['index.php?menuaction=ranking.ranking_result_ui.index&ajax=true'] }]
      options = Hash[
        query: {
          menuaction: 'ranking.jdots_framework.ajax_exec.template',
          json_data: JSON.generate(data)
        },
        headers: { 'Cookie' => sessionid }
      ]
      begin
        response = HTTParty.post(url, options)
        # puts response.code
        # puts response.headers.inspect
        # puts JSON.parse(response.body)
        resp = JSON.parse(response.body)
        resp['response'][2]['data']['data']['etemplate_exec_id']
      rescue
        puts 'Exception raised in EGroupwareSessionAPI.sessionid'
        nil
      end
    end

    # It seems as though the calendar needs to be set *before* any other variables, at least if
    # we're not using the default "International" calendar
    def set_calendar sessionid, egw_session
      url  = 'https://ifsc.egroupware.net/egw/json.php'
      auth = { 'Cookie' => sessionid }
      data = compose_calendar(egw_session)
      begin
        options = Hash[
          query: { menuaction: 'EGroupware\Api\Etemplate::ajax_process_content',
                   json_data: JSON.generate(data) },
          headers: auth]
        HTTParty.post(url, options)
        # puts response.code
        # puts response.headers.inspect
        # puts response.body
        # response
      rescue
        puts 'Exception raised in EGroupwareSessionAPI.set_calendar'
        nil
      end
    end

    # Having set the calendar, it looks as though we can set other parameters more or less freely
    def set_comp sessionid, egw_session
      url  = 'https://ifsc.egroupware.net/egw/json.php'
      auth = { 'Cookie' => sessionid }
      data = compose_comp(egw_session)
      begin
        options = Hash[
          query: { menuaction: 'EGroupware\Api\Etemplate::ajax_process_content',
                   json_data: JSON.generate(data) },
          headers: auth]
        response = HTTParty.post(url, options)
        # puts response.code
        # puts response.headers.inspect
        puts response.body
        response
      rescue
        puts 'Exception raised in EGroupwareSessionAPI.set_comp'
        nil
      end
    end
  end
end
