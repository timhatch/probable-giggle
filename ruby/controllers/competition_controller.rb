# Handlers for '/competition' routes 
#

module Perseus
  class CompetitionController < Perseus::ApplicationController

    get '/' do
      hash = Hash[params.map{|(k,v)| [k.to_sym,v.to_i]}]

      DB[:Competitions]
        .where(hash)
        .first
        .to_json
    end
  end
end