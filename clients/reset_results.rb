#!/usr/bin/ruby

# Command line script to reset the livestream
#
require_relative '../ruby/helpers/localdb_accessors_results'

# Delete any messages cached in the wventstream interface
Perseus::LocalDBConnection::Results.reset(wet_id: 30, route: 2, grp_id: 5)
