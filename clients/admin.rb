#!/usr/local/bin/ruby

# Set the competition ID, import starting lists
#

require 'httparty'
require 'optparse'

def active_competition wet_id
  HTTParty.post('http://localhost/session', body: { wet_id: wet_id })
end

def reset_stream
  HTTParty.delete('http://localhost/results/broadcast')
end

# Parse options
ARGV << '-h' if ARGV.empty?

OptionParser.new do |opts|
  opts.banner = 'Usage: admin.rb [options]'

  opts.on('-w', '--wetid WETID', Integer, 'Set competition ID') { |v| active_competition(v) }

  opts.on('-p', '--purge', 'Purge the EventStream') { reset_stream }

  opts.on('-h', '--help', 'Display this screen') do
    puts opts
    exit
  end
end.parse!
