
# Module  Perseus                 - The namespace for all application code
# Module  CSVParser               - Helper functions to parse CSV files
#
require 'csv'

module Perseus
  # CSVParser
  module CSVParser

    # Parse a csv file containing (as a minimum) per_id and start_order pairs
    # creating (for each line) a hash corresponding to the data and return an
    # array of these hashes
    #
    def parse_csv_file params
      array = []
      if params[:file]
        file = params[:file][:tempfile]
        
        CSV.foreach(file, { headers: true, converters: :numeric }) do |row|
          array << Hash[row.to_hash.map{|(k,v)| [k.to_sym,v]}]
        end
      end
      array
    end
  end
end
    
    
