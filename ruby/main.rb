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

### Tests
### Test Mithril routes
##get '/test/routes' do
##  haml :routes
##end
##
### Route handling to get basic competition data
##get '/test' do
##  haml :conditional_views 
##end
##


# Public: Route handling for the admin/registration page
#
# params - TODO: Add WetId and CompName as params
#
get '/registration' do
  # TODO Set these parameters based on earlier input. e.g. get values from a database 
  @title = 'Test Comp'
  @wetid = 1
  haml :registration, :layout => :mithril
end

post '/registration' do
  if params[:file]
    file     = params[:file][:tempfile]
    data     = []
    # NOTE: header_converters downcases all headers...
#    csv_opts = { headers: true, converters: :numeric, header_converters: :symbol }
#    CSV.foreach(file, csv_opts) { |row| resp.push row.to_hash }
    csv_opts = { headers: true, converters: :numeric }
#    CSV.foreach(file, csv_opts) { |row| data.push Hash[row.to_hash.map{|(k,v)| [k.to_sym,v]}] }
#    Startlist.set_starters({ starters: data })
    
    CSV.foreach(file, csv_opts) do |row|
      person = Hash[row.to_hash.map{|(k,v)| [k.to_sym,v]}]
      Startlist.set_starter person
    end
  else
    p 'No file provided'
  end
end


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


# Route handling for the qualification round results page
#
get '/results' do
  # TODO Set these parameters based on earlier input. e.g. get values from a database 
  @title = 'Test Comp'
  @wetid = 1
  # e.g. re-route to /mithril/params
  haml :results, :layout => :mithril
end


# CRUD handling for the results for an individual climber
#
get '/climber' do
#  temp = Hash[params]
  prms = Hash[params.map{ |(k,v)| [k.to_sym,v] }]
  resp = Resultlist.get_results prms 
  resp.first.to_json
end 

put '/climber/round' do
  temp = Hash[params]
  rslt = temp.delete("result_json")
  prms = Hash[temp.map{|(k,v)| [k.to_sym,v.to_i]}]

  Resultlist.set_result_multi prms, rslt
  rslt
end

put '/climber/bloc' do
#  p params
  rslt = params.delete("result_json")
  prms = Hash[params.map{|(k,v)| [k.to_sym,v.to_i]}]
#  temp = Hash[params]
#  prms = Hash[temp.map{|(k,v)| [k.to_sym,v.to_i]}]

#  p params
#  p temp
#  p rslt
#  p prms

#  Resultlist.set_result_single prms, rslt
  rslt
end

# 
get '/nexus' do
  haml :nexus
end

get '/competition' do
  temp = Hash[params]
  prms = Hash[temp.map{|(k,v)| [k.to_sym,v.to_i]}]
  resp = Competition.get_competition prms
  resp.first.to_json
end


__END__

@@results
%script{ src: './m-results.js' }
:javascript
  var c = m.component(App.CompetitionVC, { wetid: "#{@wetid}", title: "#{@title}" })
  m.mount(document.body, c)
  
@@registration
%script{ src: './m-registration.js' }
:javascript
  var c = m.component(App.RegistrationVC, { wetid: "#{@wetid}", title: "#{@title}" })
  m.mount(document.body, c)
