require 'sqlite3'
require 'json'

# Set the working directory for testing in Textmate
Dir.chdir("/users/timhatch/sites/flashresults/ruby/data")

module SQLAccessor
  
  @db   = SQLite3::Database.new './results.db'

  module_function
  
  def get_climber_data perid
    @db.execute("SELECT * FROM Climbers WHERE Perid IS #{perid}") do |row|
      p row
    end
  end
end

#SQLAccessor.get_climber_data 1030

require 'sequel'

module DBAccessor 

  @db = Sequel.sqlite('./results.db')

  module_function
  def get_climber_data perid
    p @db[:Climbers].where(PerId: perid).first
  end
end

DBAccessor.get_climber_data 1030