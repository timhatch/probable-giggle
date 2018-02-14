#!/usr/bin/ruby

require 'httparty'
require 'json'
require 'csv'
require 'optparse'

options = {}
ARGV << '-h' if ARGV.empty?
OptionParser.new do |opts|
  opts.banner = 'Usage: csv_export.rb [options]'

  opts.on('-w', '--wet_id WETID', 'Competition ID')  { |v| options[:wet_id] = v.to_i || 0 }
  opts.on('-r', '--route ROUTE', 'Current Route')    { |v| options[:route]  = v.to_i || 0 }
  opts.on('-c', '--grp_id GRPID', 'Active Category') { |v| options[:grp_id] = v.to_i || 0 }

  opts.on('-h', '--help', 'Display this screen') do
    puts opts
    puts 'Require arguments -w <wet_id> -c <grp_id> -r <route>'
    exit
  end
end.parse!

# If we haven't exited (where no options have been passed) then run the script
@params = options
@url    = 'http://localhost/results/route'

# Convert the results_jsonb data into an array of values
# NOTE: No explicit check is made as to the order, we presume that the order of boulders
# is always p1, p2... and within each always a, b, t
def to_array result_jsonb
  result_jsonb.nil? ? [] : result_jsonb.map { |_k, v| v.values }.flatten
end

# Transpose TA and Z (so that we present TN/ZN/TA/ZA per the 2018 ranking methodology)
def transpose array
  [array[0], array[2], array[1], array[3]]
end

# Fetch a response from the results service
response = HTTParty.get(@url, query: @params)
data = response.code == 200 ? JSON.parse(response.body) : nil

# Convert the response and write to a csv file
file = "./#{options[:wet_id]}_#{options[:grp_id]}_#{options[:route]}.csv"
CSV.open(file, 'wb') do |csv|
  csv << %w(Bib Lastname Firstname Nation Start Prev Rank Results)
  data.map do |person|
    boulder_res = to_array(person.delete('result_jsonb'))
    final_res   = transpose(person.delete('sort_values'))
    csv << person.values.concat(boulder_res).concat(final_res)
  end
end
