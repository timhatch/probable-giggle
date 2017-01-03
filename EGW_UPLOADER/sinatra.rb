require 'sinatra'
require 'httparty'
require 'sinatra/cookies'
require 'cgi'

get '/login' do
  # Login
  url = 'https://ifsc.egroupware.net/egw/login.php'
  credentials = Hash[
    passwd_type: 'text', account_type: 'u', logindomain: 'ifsc-climbing.org',
    login: 'tim', passwd: 'mockpo2014'
  ]
  resp = HTTParty.post url, { body: credentials }
  # Pass-through cookies
  CGI::Cookie.parse(resp.request.options[:headers]['Cookie']).each do |key, value| 
    cookies[key] = value
  end
  # returb the passed-through page
  return resp.body
end
