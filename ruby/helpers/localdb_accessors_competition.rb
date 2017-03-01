# Module  Perseus                 - The namespace for all application code
# Module  LocalDBConnection       - Helper methods to access the LAN database
# Module  Competition             - Competition related methods
#
require 'sequel'
require 'pg'
require 'json'

# Competition data getter/setters
#
module Perseus
  module LocalDBConnection
    module Competition
      # Instance variable (could make this a const)
      @default_comp = { wet_id: 0, city: 'Längenfeld', date: '2017-01-01', type: 'B',
                        title: 'Test Competition' }

      module_function

      # Get the "active" competition (determined from the Session parameters)
      def active
        DB[:Competitions].join(:Session, [:wet_id]).first
      end

      # Insert a new competition (or overwrite an existing competition)
      # @params
      # - A hash containing :wet_id, :grp_id and :route values
      def insert params
        args = Hash[@default_comp.map { |k, v| [k, params[k] || v] }]
        args[:wet_id] = args[:wet_id].to_i
        DB[:Competitions].where(wet_id: args[:wet_id]).delete
        DB[:Competitions].insert(args)
      end
    end
  end
end
