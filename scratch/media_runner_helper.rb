# Module  Perseus                 - The namespace for all application code
# Class   CWIFResultsModus        - Helper functions to calculate results (CWIF contest mode)
# Class   IFSCResultsModus        - Helper functions to calculate results (IFSC standard mode)
# Class   MediaRunner             - Helper methids to output data for live streaming
#
require 'sequel'
require 'pg'
require 'json'
require 'csv'

# Class   CWIFResultsModus        - Helper functions to calculate results (CWIF c
#
module Perseus
  module CWIFResultsModus
    module_function

#    TODO: Check that these generators work with nil values
#    def result_generator
#      t  = Sequel.pg_array_op(:sort_values)[1] * 13
#      ta = Sequel.pg_array_op(:sort_values)[2] * 3
#      b  = Sequel.pg_array_op(:sort_values)[3].cast(:text)
#
#      Sequel.cast(t - ta, :text) + 'b' + b
#   end
    def rank_generator
      t  = Sequel.pg_array_op(:sort_values)[1] * 13
      ta = Sequel.pg_array_op(:sort_values)[2] * 3
      b  = Sequel.pg_array_op(:sort_values)[3]

      [(t - ta).desc(:nulls=>:last), b.desc]
    end    
  end

  module IFSCResultsModus
    module_function
#    TODO: Check that these generators work with nil values
#    def result_generator
#      t  = Sequel.pg_array_op(:sort_values)[1].cast(:text) 
#      ta = Sequel.pg_array_op(:sort_values)[2].cast(:text)
#      b  = Sequel.pg_array_op(:sort_values)[3].cast(:text) 
#      ba = Sequel.pg_array_op(:sort_values)[4].cast(:text)
#      str =  t + 't' + ta + ' ' + b + 'b' + ba 
#    end
    def rank_generator 
    [
      Sequel.pg_array_op(:sort_values)[1].desc(:nulls=>:last),
      Sequel.pg_array_op(:sort_values)[2],
      Sequel.pg_array_op(:sort_values)[3].desc,
      Sequel.pg_array_op(:sort_values)[4],
      :rank_prev_heat
    ]
    end
  end
end

module Perseus  
  module MediaRunner
    # Instantiate database access
    DB = Sequel.connect(ENV['DATABASE_URL'] || 'postgres://timhatch@localhost:5432/test')
#    DB = Sequel.connect(ENV['DATABASE_URL'] || 'postgres://postgres@melody.local:5432/test')
    DB.extension :pg_array, :pg_json          # Needed to insert arrays
    Sequel.extension :pg_array_ops  # Needed to query stored arrays
    Sequel.extension :pg_json
    # PRIVATE
    
    # Return a Sequel query to get qualification results/ranking data (CWIF scoring modus)
    # @params: wet_id, grp_id
    #
    def self.qualification_results params
      args         = Hash[params.map{ |(k,v)| [k.to_sym,v.to_i] }]
      args[:route] = 1
      
      DB[:Results]
      .where(args)
      .select(:per_id)
      .select_append(
        Sequel.pg_array_op(:sort_values)[1].as(:q_t),
        Sequel.pg_array_op(:sort_values)[2].as(:q_ta),
        Sequel.pg_array_op(:sort_values)[3].as(:q_b))
      .select_append{
        rank.function.over(
          partition: [:wet_id, :grp_id, :route],
          order: Perseus::CWIFResultsModus.rank_generator
        ).as(:q_rank)
      }
    end  
    
    # Return a Sequel query to get semifinal results/ranking data (IFSC scoring modus)
    # @params: wet_id, grp_id
    #
    def self.semifinal_results params
      params = Hash[params.map{ |(k,v)| [k.to_sym,v.to_i] }]
      params[:route] = 2
#     p params

      DB[:Results]
      .where(params)
      .select(:per_id, 
        Sequel.as(:start_order, :s_sn), 
        Sequel.as(:sort_values, :s_array), 
        Sequel.as(:result_json, :s_rjson))
      .select_append{
        rank.function.over(
          partition: [:wet_id, :grp_id, :route],
          order: Perseus::IFSCResultsModus.rank_generator
        ).as(:s_rank)
      }
    end
    
    # Return a Sequel query to get final results/ranking data (IFSC scoring modus)
    # @params: wet_id, grp_id
    #
    def self.final_results params
      params = Hash[params.map{ |(k,v)| [k.to_sym,v.to_i] }]
      params[:route] = 3
#      p params
      
      DB[:Results]
      .where(params)
      .select(:per_id,
        Sequel.as(:start_order, :f_sn),
        Sequel.as(:sort_values, :f_array),
        Sequel.as(:result_json, :f_rjson))
      .select_append{
        rank.function.over(
          order: Perseus::IFSCResultsModus.rank_generator
        ).as(:f_rank)
      }
    end

    def self.parse_result type, result
      regex   = Regexp.new '#{type}([0-9]{1,})'
      matched = regex.match(result)
      if matched
        scored_attempts = matched.captures.to_a.first.to_i
      else
        scored_attempts = nil
      end
    end

    def self.parse_results_json data
      json = JSON.parse(data) unless data.nil?
      t_arr = []
      b_arr = []
      a_arr = []
      (1..4).each do |i|
        key = 'p' + i.to_s
        val = json.nil? ? '' : json[key]
        t_arr << parse_result('t', val)
        b_arr << parse_result('b', val)
        a_arr << parse_result('a', val)
      end
      t_arr + b_arr + a_arr
    end
    
    # PUBLIC
    module_function
    # Create a consolidated list of results for Q/S/F 
    # @params: wet_id, grp_id
    # @return: array of consolidated results
    #
    def update_consolidated_results params
      DB.create_table! :TTSemi, { as: self.semifinal_results(params), temp: true }
      DB.create_table! :TTQual, { as: self.qualification_results(params), temp: true }
      DB.create_table! :TTFinl, { as: self.final_results(params), temp: true }
      
      DB[:TTSemi]
        .select(:Climbers__per_id,:lastname, :firstname, :nation)
        .select_append(:q_rank, :q_t, :q_ta, :q_b)
        .select_append(:s_rank, :s_sn, :s_array, :s_rjson)
        .select_append(:f_rank, :f_sn, :f_array, :f_rjson)
        .left_join(:Climbers, :per_id => :per_id)
        .left_join(:TTQual, :per_id => :per_id)
        .left_join(:TTFinl, :per_id => :per_id)
        .order([:f_rank, :s_rank])
        .all
    end

    # Create a consolidated list of results for Q/S/F
    # @params: wet_id, grp_id
    # @return: csv file
    #
    def export_consolidated_results params
      filename = 'results_#{params[:wet_id].to_s}_#{params[:grp_id].to_s}.csv'
      
      File.new(filename, 'w') unless File.exists?(filename)
      File.open(filename,'w') do |file|
        
        file.write 'per_id\,lastname\,firstname\,nation\,q_rank\,q_t\,q_ta\,q_b\,' <<    
        's_rank\,s_sn\,s_t\,s_ta\,s_b\,s_ba\,s_t1\,s_t2\,s_t3\,s_t4\,' <<
        's_b1\,s_b2\,s_b3\,s_b4\,s_a1\,s_a2\,s_a3\,s_a4\,' <<
        'f_rank\,f_sn\,f_t\,f_ta\,f_b\,f_ba\,f_t1\,f_t2\,f_t3\,f_t4\,' <<
        'f_b1\,f_b2\,f_b3\,f_b4\,f_a1\,f_a2\,f_a3\,f_a4\n'        
        
        data = update_consolidated_results(params)      
        data.each do |row|
          row[:s_array] = Array.new(4) if row[:s_array].nil?
          row[:f_array] = Array.new(4) if row[:f_array].nil?
          row[:s_rjson] = parse_results_json(row[:s_rjson])
          row[:f_rjson] = parse_results_json(row[:f_rjson])
        
          file.write row.values.flatten.to_csv
        end
      end
    end
    
    # Export Qualification Results 
    # NOTE: Put this here temporarily : Outputs a CSV file of qualification results
    # for one category (gender) and a defined age range
    # Need to think about the architecture of this - in theory this works around having separate
    # age groups.
    #
    def export_results params, max_age: 99, min_age: 10
      filename = 'results_#{params[:grp_id].to_s}_age_#{max_age}.csv'

      File.new(filename, 'w') unless File.exists?(filename)
      File.open(filename, 'w') do |file|
        year = Sequel.cast(Date.today, DateTime).extract(:year).cast(Integer)
        data = DB[:Results]
               .where(params)
               .where { birthyear > year - max_age }
               .select(:lastname, :firstname, :nation)
               .select_append(
                 Sequel.pg_array_op(:sort_values)[1].as(:q_t),
                 Sequel.pg_array_op(:sort_values)[2].as(:q_ta),
                 Sequel.pg_array_op(:sort_values)[3].as(:q_b)
               )
               .select_append {
                 rank.function.over(order: Perseus::CWIFResultsModus.rank_generator)
               }
               .join(:Climbers, :per_id => :per_id)

        data.all.each { |row| file.write(row.values.to_csv) }
      end
    end
  end
end

#params = {wet_id: 2, grp_id: 5, route: 1}
#p Perseus::MediaRunner.export_results params, max_age: 19
