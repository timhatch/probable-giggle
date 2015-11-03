#!/usr/bin/ruby

require 'sinatra'
require 'tilt/haml'
require 'rack/contrib'

require_relative './data'

# Use the content parser in rack/contrib to allow parsing both of both  
# application/x-www-form-urlencoded and application/json encoded data
use Rack::PostBodyContentTypeParser 

set :bind, '0.0.0.0'
set :port, 4567

get '/' do
  @title = 'Test Comp'
  @wetid = 1 

  haml :admin
end

get '/mithril' do
  @title = 'Test Comp'
  @wetid = 1
  haml :mithril
end

get '/climber' do
  #content_type :json
  # Convert the passed parameters into a Hash object
  #data = Climber.get_result PerId: Hash[params].
  data = Hash[params]['PerId']
  #data.to_json
  res  = Climber.get_result PerId: data  
end 

put '/:name' do |n|
  "hello #{name}"
end

post '/test' do
  temp = Hash[params]
  data = Hash[temp.map{|(k,v)| [k.to_sym,v]}]

  Climber.set_result data
  data[:ResString]
end