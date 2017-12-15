# Module  Perseus                 - The namespace for all application code
# Module  EGroupwarePublicAPI     - Helper functions to access the eGroupware Public API
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
