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
require 'sequel'
require 'pg'

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
  db   = Sequel.connect('postgres://timhatch@localhost:5432/test')
  data = import(file)
  data.each do |x|
    db[:Climbers].where(per_id: x[:per_id]).update(birthyear: x[:birthyear])
  end
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
