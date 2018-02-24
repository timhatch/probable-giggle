#!/usr/bin/ruby

# Commoand Line script to register climbers and create a new qualification startlist
#
#
require 'sequel'
require 'pg'
require 'json'
require 'csv'

require_relative '../ruby/helpers/localdb_accessors'
require_relative '../ruby/helpers/ifsc_boulder_modus'

# Experimental Method to finalise rank for CWIF Qualification
module Perseus
  module LocalDBConnection
    module CWIFResults
      def self.rank
        Sequel.function(:rank).over(
          partition: [:wet_id, :grp_id, :route],
          order: [
            ((13 * Sequel.pg_array_op(:sort_values)[1]) -
             (3 * Sequel.pg_array_op(:sort_values)[2])).desc(nulls: :last),
            Sequel.pg_array_op(:sort_values)[3].desc
          ]
        ).as(:result_rank)
      end

      def self.perid x
        starter = DB[:Climbers]
                  .select(:per_id)
                  .where(lastname: x[:lastname], firstname: x[:firstname])
                  .first
        x.merge!(starter) unless starter.nil?
      end

      module_function

      def append_rank params
        data = DB[:Results].where(params)

        data.select(:per_id)
            .select_append(&method(:rank))
            .each { |x| data.where(per_id: x[:per_id]).update(rank_this_heat: x[:result_rank]) }
      end

      def extract_starters
        # Fetch data
        file = './entrants-180219.csv'
        data = CSV.read(file, headers: true, header_converters: :symbol)
                  .map(&:to_hash)
                  .each(&method(:perid))

        # Add new Climbers where no per_id in database
        next_i = DB[:Climbers].select(:per_id).reverse_order(:per_id).first[:per_id] + 1
        data.select { |x| x[:per_id].nil? }.each.with_index(next_i) do |x, i|
          x[:per_id] = i
          y          = Hash[%i(per_id firstname lastname nation gender).map { |k| [k, x[k]] }]
          DB[:Climbers].insert(y)
        end

        # Print out the starters with per_id values
        cols = data.first.keys
        cstr = CSV.generate do |csv|
          csv << cols
          data.each { |row| csv << row.values }
        end
        File.open('./starters.csv', 'w:UTF-8') { |f| f.write(cstr) }

        # Create a new startlist
        DB[:Results].where(wet_id: 30, route: 0).delete
        data.each do |x|
          y = x[:gender] == 'M' ? 6 : 5
          DB[:Results].insert(wet_id: 30, route: 0, per_id: x[:per_id], grp_id: y)
        end
      end
    end
  end
end
# Perseus::LocalDBConnection::CWIFResults.append_rank(wet_id: 31, route: 0, grp_id: 5)
Perseus::LocalDBConnection::CWIFResults.extract_starters
