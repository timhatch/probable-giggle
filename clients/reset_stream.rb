#!/usr/bin/ruby

require 'httparty'

# Delete any messages cached in the wventstream interface
@url = 'http://localhost/results/broadcast'
HTTParty.delete(@url)
