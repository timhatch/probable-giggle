# Module  Perseus                 - The namespace for all application code
# Class   CompetitionController   - Subclasses ApplicationController
#
# CompetitionController manages routes calling for information on any specific competition:
# Currently implements:
# - A single Getter retruning the first matchingcompettion
#
module Perseus
  class CompetitionController < Perseus::ApplicationController
    get '/' do
      hash = Hash[params.map { |(k, v)| [k.to_sym, v.to_i] }]

      DB[:Competitions]
        .where(hash)
        .first
        .to_json
    end
  end
end
