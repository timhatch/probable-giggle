# Handlers for '/competition' routes 
#

module Perseus
  class CompetitionController < ApplicationController

    get '/' do
      prms = Hash[params.map{|(k,v)| [k.to_sym,v.to_i]}]

      resp = DB[:Competitions]
        .where(prms)
        .all
      resp.first.to_json
    end
  end
end