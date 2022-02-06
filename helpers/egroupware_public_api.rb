# Module  Perseus                 - The namespace for all application code
# Module  EGroupwarePublicAPI     - Helper functions to access the eGroupware Public API
#
require 'httparty'

require_relative 'query_types'

#
# PUBLIC API
#
module Perseus
  # EGroupwarePublicAPI - Helper functions to access the eGroupware Public API
  module EGroupwarePublicAPI
    @url = 'http://egw.ifsc-climbing.org/egw/ranking/json.php'
    # @url = 'https://digitalrock.egroupware.de/egw/ranking/json.php'

    # API Accessor
    # Interrogate EGroupware using the JSON API, Aborting if the site cannot be accessed or the
    # server returns a null response
    # Returns a JSON object (with keys represented as strings not symbols)
    # @params - Hash object containing variables (see the EGroupware API reference for options
    def self.get_json params
      HTTParty.get(@url, query: params.merge(timestamp: Time.now.to_i))
              .yield_self { |r| r.code == 200 ? JSON.parse(r.body) : nil }
    rescue StandardError
      puts 'Exception raised in EGroupwarePublicAPI:get_json'
      nil
    end

    # to_egw_results_query :: -> ()
    # Return a proc to convert between perseus and egroupware query formats
    def self.to_egw_results_query
      egw_keys = { comp: :wet_id, cat: :grp_id, route: :route }
      ->(x) { Hash[egw_keys.map { |k, v| [k, x[v]] }] }
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

    # get_results :: (a) -> ([b])
    # Fetch the startlist/resultslist for a given round
    def get_results params
      QueryType.result[params]
               .yield_self(&to_egw_results_query)
               .yield_self(&method(:get_json))['participants']
    end

    # Fetch the calendar for somw  year.
    # Gets the current year if none provided
    def get_calendar params
      get_json(year: params[:year] || Date.now.year)['competitions']
    end
  end
end

# puts Perseus::EGroupwarePublicAPI.get_starters(wet_id: 5759, grp_id: 81, route: 3)
# puts Perseus::EGroupwarePublicAPI.get_results(wet_id: 5759, grp_id: 81, route: 2)
# puts Perseus::EGroupwarePublicAPI.get_starters(wet_id: 1572,  grp_id: 284)
# p Perseus::EGroupwarePublicAPI.get_calendar(year: 2019)
# p Perseus::EGroupwarePublicAPI.get_calendar(year: 2023).nil?
