# Module  Perseus                 - The namespace for all application code
# Module  LocalDBConnection       - Helper methods to access the LAN database
#                                   LocalDBConnection methods are broken into a series of
#                                   sub-modules.
#                                   1) Competitors - Adding/editing/deleting competitors
#                                   2) Competition - Adding/editing/deleting competitions
#                                   3) Results     - Adding/editing/deleting results
#                                   4) Session     - Editing Session data
#                                   5) Startlist   - Adding/editing/deleting startlists
#
require 'sequel'
require 'pg'
require 'json'

# Base module declaration, instantiates a connection to a Postgresql database
#
module Perseus
  module LocalDBConnection
    # Instantiate database access
    DB = Sequel.connect(ENV['DATABASE_URL'] || 'postgres://timhatch@localhost:5432/perseus')
    DB.extension :pg_array, :pg_json  # Needed to insert arrays
    Sequel.extension :pg_array_ops    # Needed to query stored arrays
    Sequel.extension :pg_json
  end
end
