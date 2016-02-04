# Handlers for '/competition' routes 
#

module Perseus
  class CompetitionController < ApplicationController

    get '/' do
      hash = Hash[params.map{|(k,v)| [k.to_sym,v.to_i]}]

      DB[:Competitions]
        .where(hash)
        .all
        .first
        .to_json
    end
  end
end