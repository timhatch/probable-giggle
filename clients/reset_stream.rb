#!/usr/bin/ruby

# Command line script to reset the livestream
#
require 'httparty'

# Delete any messages cached in the wventstream interface
@url = 'http://localhost/results/broadcast'
HTTParty.delete(@url)
