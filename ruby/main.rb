#!/usr/bin/ruby

require 'sinatra'
require 'tilt/haml'
require 'rack/contrib'
require 'csv'

require_relative './data'

# Use the content parser in rack/contrib to allow parsing both of both  
# application/x-www-form-urlencoded and application/json encoded data
use Rack::PostBodyContentTypeParser 

# Allow access from the local network
set :bind, '0.0.0.0'
#set :port, 4567

# Test
# Public: Interface to the eGroupware-format results display
# 
# params -  A Hash containing
#           :WetId -  The unique reference id for the competition
#           :GrpId -  The unique reference number for the category 
#           :route -  The unique reference for the route/round    
#
get '/egw' do
  redirect '/d.assets/index.boulder.html'
end

# Update results
#
get '/egw/ranking' do
  resp = {}
  temp = Hash[params]
  prms = Hash[temp.map{|(k,v)| [k.to_sym,v]}]
  
  resp[:participants] = Resultlist.get_results prms
  resp.to_json
end