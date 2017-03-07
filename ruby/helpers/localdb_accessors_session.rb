# Module  Perseus                 - The namespace for all application code
# Module  LocalDBConnection       - Helper methods to access the LAN database
# Module  Session                 - Session creation methods
#
require 'sequel'
require 'pg'
require 'json'

# Session data getter/setters
# The Session table contains only one entry by design
#
module Perseus
  module LocalDBConnection
    module Session
      module_function

      # Get the session data
      #
      def get
        DB[:Session].first
      end

      # Update the Session with the provided parameters
      # @params (both optional)
      # - wet_id - the numeric id for the competition
      # - auth   - a string in the format 'sessionid=sljhfgagagfhjkdsgv'
      #
      def set params
        query = {}
        params.key?(:wet_id) && query[:wet_id] = params[:wet_id].to_i
        params.key?(:auth)   && query[:auth]   = params[:auth]
        DB[:Session].update(query) unless query.empty?
      end

      # Clear (reset) the session parameters
      #
      def reset
        DB[:Session].update(wet_id: nil, auth: nil)
      end
    end
  end
end

# puts Perseus::LocalDBConnection::Session.authorisation(wet_id: 99)
# puts Perseus::LocalDBConnection::Session.authorisation(wet_id: '')
# puts Perseus::LocalDBConnection::Session.authorisation(wet_id: 'asbc')
# puts Perseus::LocalDBConnection::Session.authorisation(auth: nil)
# puts Perseus::LocalDBConnection::Session.authorisation(auth: '')
# puts Perseus::LocalDBConnection::Session.authorisation(auth: 99)
# puts Perseus::LocalDBConnection::Session.authorisation(wet_id: 'sessionid=abc')
# puts Perseus::LocalDBConnection::Session.authorisation(auth: 'sessionid=abc')
# puts Perseus::LocalDBConnection::Session.competition(wet_id: '99')
# puts Perseus::LocalDBConnection::Session.competition(wet_id: 'hello')
# puts Perseus::LocalDBConnection::Session.competition(wet_id: '')
# puts Perseus::LocalDBConnection::Session.competition(wet_id: nil)
# puts Perseus::LocalDBConnection::Session.competition(wet_id: 99)
# puts Perseus::LocalDBConnection::Session.competition(atuhr: 99)

# puts Perseus::LocalDBConnection::Session.reset
