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
    # @params
    # - login   (name)
    # - passwd  (password)
    #
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
      rescue StandardError => e
        puts 'Exception raised in EGroupwareSessionAPI.login'
        puts e
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

# p Perseus::EGroupwareSessionAPI.login({ login: 'tim', passwd: 'mockpo2014' })
