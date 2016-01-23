require 'sequel'
require 'pg'
require 'json'

 

module Perseus
  module CompetitionController

    DB = Sequel.connect(ENV['DATABASE_URL'] || "postgres://timhatch@localhost:5432/test")

    def self.registered(app)

      get_competition = lambda do
        prms = Hash[params.map{|(k,v)| [k.to_sym,v.to_i]}]

        resp = DB[:Competitions]
        .where(prms)
        .all
    
        resp.first.to_json
      end
  
      app.get '/competition', &get_competition
    end      
  end
end

module Perseus
  module ClimberController
  
    def self.registered(app)
  
      app.get '/nexus' do
        haml :nexus
      end

    end
  end
end
