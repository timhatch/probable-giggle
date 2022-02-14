require 'sequel'
require 'pg'
require 'json'

require 'benchmark'

require_relative 'ifsc_boulder_modus'
require_relative 'query-types'

module Perseus
  module LocalDBConnection
    module Results

      module_function

      def self.rank
        Sequel.function(:rank).over(
          partition: %i[wet_id grp_id route],
          order: Perseus::IFSCBoulderModus.rank_generator
        ).as(:result_rank)
      end

      def via_create_table(query)
        dataset = DB[:Results].select(:per_id).select_append(&method(:rank)).where(query)
        DB.transaction do
          DB.create_table!(:Ranks, temp: true, as: dataset) 

          DB[:Results]
            .from(:Results, :Ranks)
            .where(query).where(Sequel[:Results][:per_id] => Sequel[:Ranks][:per_id])
            .update(rank_this_heat: Sequel[:Ranks][:result_rank])
        end
      end

      def via_looped_query(query)
        dataset = DB[:Results].select(:per_id).where(query)

        # Calculate :result_rank for the group and then update each result
        # TODO: Wrap this in DB.transaction
        dataset.select_append(&method(:rank)).all.each do |entry|
          dataset.where(per_id: entry[:per_id])
                 .update(rank_this_heat: entry[:result_rank])
        end
      end
    end
  end
end

def looped
  500.times { Perseus::LocalDBConnection::Results.via_looped_query({wet_id: 7, route: 2, grp_id: 6}) }
end

def create
  500.times { Perseus::LocalDBConnection::Results.via_create_table({wet_id: 7, route: 2, grp_id: 6}) }
end

Benchmark.bm do |x|
  x.report('Looped:') { looped }
  x.report('Create:') { create }
end

=begin
Looped query benchmarking:

          user      system    total     real
Looped:   6.940409 1.358185   8.298594  ( 41.596686)
Looped:   7.187059  1.296528  8.483587  ( 46.132224)
Looped:   6.569980  1.282912  7.852892  ( 27.308460) <= when wrapped in a DB.transaction
Looped:   6.450571  1.384514  7.835085  ( 27.377620) <= when wrapped in a DB.transaction

Using a temporary table

          user      system    total     real
Create:   1.388146  0.338100  1.726246  (  7.946135)
Create:   1.505555  0.277446  1.783001  (  8.582115)
Create:   1.436501  0.284212  1.720713  (  7.901822)

=end
