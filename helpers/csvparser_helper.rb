
# Module  Perseus                 - The namespace for all application code
# Module  CSVParser               - Helper functions to parse CSV files
#
require 'csv'

module Perseus
  # CSVParser
  module CSVParser
    module_function

    # Parse a csv file creating (for each line) a hash corresponding to the data and return an
    # array of these hashes
    # NOTE: The CSV file MUST CONTAIN HEADERS WITH THE HASH KEY VALUES
    #
    def parse_csv_file params
      array = []
      if params[:file]
        file = params[:file][:tempfile]

        CSV.foreach(file, headers: true, converters: :numeric) do |row|
          data = Hash[row.to_hash.map { |k, v| [k, v] }]
          array << data unless data.empty?
        end
      end
      array
    end
  end
end

# NOTE: Try also the following
# def parse_csv_file params
#   params[:file]
#   ? CSV.read(params[:file][:tempfile], headers: true, converters: numeric).map(&:to_hash)
#   : []
# end
