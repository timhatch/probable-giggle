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
  opts.on('-p', '--perid PERID', Integer, 'Climber ID')      { |v| options[:per_id] = v }
  opts.on('-s', '--start START', Integer, 'Climber start order') { |v| options[:start_order] = v }

  opts.on('-h', '--help', 'Display this screen') do
    puts opts
    puts 'Require arguments -w [wet_id] -c [grp_id] -r [route]'
    puts 'Optional arguments -p [per_id] -s [start_order]'
    exit
  end
end.parse!

# If we haven't exited (where no options have been passed) then run the script
@params = { wet_id: 0, route: 0, grp_id: 0 }.merge(options)
HTTParty.delete('http://localhost/results/reset', query: @params)
