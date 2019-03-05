#!/usr/local/bin/ruby

# Command Line script to output results data in CSV format
#

require 'httparty'
require 'json'
require 'csv'
require 'optparse'

options = {}
ARGV << '-h' if ARGV.empty?

OptionParser.new do |opts|
  opts.banner = 'Usage: export_results.rb [options]'

  opts.on('-w', '--wetid WETID', Integer, 'Competition ID')  { |v| options[:wet_id] = v }
  opts.on('-r', '--route ROUTE', Integer, 'Current Route')   { |v| options[:route]  = v }
  opts.on('-c', '--grpid GRPID', Integer, 'Active Category') { |v| options[:grp_id] = v }

  opts.on('-h', '--help', 'Display this screen') do
    puts opts
    puts 'Require arguments -w [wet_id] -c [grp_id] -r [route]'
    exit
  end
end.parse!

# If we haven't exited (where no options have been passed) then run the script
@params = { wet_id: 0, route: 0, grp_id: 0 }.merge(options)
@url    = 'http://localhost/results'

# Convert the results_jsonb data into an array of values
# NOTE: No explicit check is made as to the order, we presume that the order of boulders
# is always p1, p2... and within each always a, b, t
def to_array result_jsonb
  result_jsonb.nil? ? [] : result_jsonb.map { |_k, v| v.values }.flatten
end

# Transpose TA and Z (so that we present TN/ZN/TA/ZA per the 2018 ranking methodology)
def transpose array
  array.nil? ? [] : [array[0], array[2], array[1], array[3]]
end

# Fetch a response from the results service
resp = HTTParty.get(@url, query: @params)
data = resp.code == 200 ? JSON.parse(resp.body) : nil

# Convert the response and write to a csv file
file = "./#{options[:wet_id]}_#{options[:grp_id]}_#{options[:route]}.csv"
CSV.open(file, 'wb') do |csv|
  csv << %w[Bib Lastname Firstname Nation Year Start Prev Rank Results]
  data.map do |person|
    boulder_res = to_array(person.delete('result_jsonb'))
    final_res   = transpose(person.delete('sort_values'))

    csv << person.values.concat(final_res) # .concat(boulder_res)
  end
end
