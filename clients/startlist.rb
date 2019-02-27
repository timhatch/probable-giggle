#!/usr/local/bin/ruby

# Command Line script to create startlist
#
# File format:
# wet_id, route, grp_id, per_id[, start_order, rank_prev_heat]

require 'csv'
require 'httparty'
require 'optparse'

# import :: (str) -> ([{a}])
# Reads the file at the given pathname and outputs an array of climber hashes
def import file
  extract = ->(x) { x.slice(:wet_id, :route, :grp_id, :per_id, :start_order, :rank_prev_heat) }
  CSV.read(file, headers: true, header_converters: :symbol, converters: :integer)
     .map(&:to_hash)
     .map(&extract)
end

# upload :: (str) -> ()
# Read a CSV file list of climbers and upload to the LAN database
def upload file
  data = import(file).to_json
  HTTParty.post('http://localhost/startlist/json', body: { data: data })
end

# Parse options
ARGV << '-h' if ARGV.empty?

OptionParser.new do |opts|
  opts.banner = 'Usage: admin.rb [options]'

  opts.on('-f', '--file FILE', 'CSV List (with headers)') { |v| upload(v) }

  opts.on('-h', '--help', 'Display this screen') do
    puts opts
    exit
  end
end.parse!
