#!/usr/local/bin/ruby

# Command Line script to register climbers
#
# File format:
# per_id,lastname,firstname,club,nation,birthyear,gender
# 2000104,Abbey,Sam,,,,M
# 2000347,Acereda Ortiz,Carla,,,1998,F

require 'csv'
require 'httparty'
require 'optparse'

# import :: (str) -> ([{a}])
# Reads the file at the given pathname and outputs an array of climber hashes
def import file
  extract = ->(x) { x.slice(:per_id, :lastname, :firstname, :nation, :birthyear, :gender) }
  CSV.read(file, headers: true, header_converters: :symbol, converters: :integer)
     .map(&:to_hash)
     .map(&extract)
end

# upload :: (str) -> ()
# Read a CSV file list of climbers and upload to the LAN database
def upload file
  data = import(file).to_json
  HTTParty.post('http://localhost/startlist/registration/json', body: { data: data })
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
