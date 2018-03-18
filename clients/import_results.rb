#!/usr/bin/ruby

require 'csv'
require_relative '../ruby/helpers/localdb_accessors'

module Perseus
  module LocalDBConnection
    module CWIFResults
      module_function
      def fix
        file = './starters.csv'
        data = CSV.read(file, headers: true, header_converters: :symbol, converters: :integer)
                  .map(&:to_hash)
                  .each { |x| DB[:Results].insert(x) }
                
        # data.each do |x|
        #   DB[:Results].insert(wet_id: 30, route: 0, per_id: x[:per_id], grp_id: 5)
        # end
        # params = { wet_id: 30, grp_id: 6, route: 0, per_id: 0 }
        # data.each do |x|
        #   params[:per_id] = x[:per_id].to_i
        #   results         = [x[:t].to_i, x[:ta].to_i, x[:z].to_i, x[:za].to_i] 
        #   DB[:Results].where(params).update(sort_values: Sequel.pg_array(results))
        # end
      end
    end
  end
end

Perseus::LocalDBConnection::CWIFResults.fix

