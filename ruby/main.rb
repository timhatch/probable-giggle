#!/usr/bin/ruby

require 'sinatra'
require 'tilt/haml'
require 'rack/contrib'

require_relative './data'

# Use the content parser in rack/contrib to allow parsing both of both  
# application/x-www-form-urlencoded and application/json encoded data
use Rack::PostBodyContentTypeParser 

# Allow access from the local network
set :bind, '0.0.0.0'
set :port, 4567

#get '/' do
#  @title = 'Test Comp'
#  @wetid = 1 
#
#  haml :admin
#end

get '/mithril' do
  # TODO Set these parameters based on earlier input. e.g. get values from a database 
  @title = 'Test Comp'
  @wetid = 1
  # e.g. re-route to /mithril/params
  haml :mithril
end

#before do |params|
#  temp = Hash[params]
#  data = Hash[temp.map{|(k,v)| [k.to_sym,v]}]
#end

get '/climber' do
  temp = Hash[params]
  data = Hash[temp.map{|(k,v)| [k.to_sym,v]}]
  
  resp = Climber.get_result data 
  resp.to_json
end 

put '/climber' do
  temp = Hash[params]
  data = Hash[temp.map{|(k,v)| [k.to_sym,v]}]

  Climber.set_result data
  data[:ResString]
end