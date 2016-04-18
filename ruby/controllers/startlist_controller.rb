# Module  Perseus                 - The namespace for all application code
# Class   StartlistController     - Subclasses ApplicationController
# 
# StartlistController manages interactions creating/updating/deleting startlist data 
# Currently implements: 
# - A Setter to import a new startlist from a formatted UTF-8 CSV file
# - A Setter creating a new startlist from the results of a previous round (CWIF scramble format)
# - A Setter creating a new startlist from the results of a previous round (IFSC format)
#
require 'csv'

module Perseus
  class StartlistController < Perseus::ApplicationController
  
    defaults = { wet_id: 0, route: 0, grp_id: 0 }
    
    # HELPERS
    helpers Perseus::CWIFResultsModus
    helpers Perseus::IFSCResultsModus

    # Create a new startlist within the results. Deletes any existing startlist for the specified 
    # competition, round and category and then creates a new list
    # @params - wet_id, grp_id, route,
    #         - dataset (an ordered list of competitors)
    def create_startlist params, dataset
      # Delete any existing startlist
      DB[:Results].where(params).delete
      
      # Loop through the ordered list of competitors and create a new startlist, either using
      # predefined start_order data or by using the positional index of the competitor
      dataset.each.with_index(1) do |person, i|
        person.merge!(params)
        person[:start_order] ||= i
        DB[:Results].insert(person)
      end      
    end      
    
    # Create a startlist from results for a previous round where the ranking for that round
    # was calculated using the CWIF 10/7/4/b modus  
    # @params: wet_id, grp_id, route, quota
    #
    # NOTE
    # This method outputs creates a startlist in rank reverse order 
    # (i.e. highest rank starts last)
    def create_from_cwif_results params
      quota = params[:quota] || 1
      
      # Fetch the results of the previous round, ordered reverse to the calculated rank in the
      # previous heat (i.e. lowest ranked first)
      dataset = DB[:Results]
      .where(params)
      .select(:per_id)
      .select_append{
        rank.function.over(order: CWIFResultsModus.rank_generator)
        .as(:rank_prev_heat)}
      .reverse_order(:rank_prev_heat)
      .all
      
      # Discard any competitors whose rank is greater than the quota and create the
      # startlist   
      dataset.keep_if { |row| row[:rank_prev_heat] <= quota }
      params[:route] += 1
      create_startlist(params, dataset)
    end
    
    # Create a startlist from results for a previous round where the ranking for that round
    # was calculated using the IFSC T/TA/B/BA modus  
    # @params: wet_id, grp_id, route, quota
    #
    # TODO
    # Figure out how/whether we can pass in the required rank_generator rather than
    # use two separate functions
    def create_from_ifsc_results params
      quota = params[:quota] || 1
      
      # Fetch the results of the previous round, ordered reverse to the calculated rank in the
      # previous heat (i.e. lowest ranked first)
      dataset = DB[:Results]
      .where(params)
      .select(:per_id)
      .select_append{
        rank.function.over(order: IFSCResultsModus.rank_generator)
        .as(:rank_prev_heat)}
      .reverse_order(:rank_prev_heat)
      .all
      
      # Discard any competitors whose rank is greater than the quota and create the
      # startlist   
      dataset.keep_if { |row| row[:rank_prev_heat] <= quota }
      params[:route] += 1
      create_startlist(params, dataset)
    end
    
    # Parse a csv file containing (as a minimum) per_id and start_order pairs
    # creating (for each line) a hash corresponding to the data and return an 
    # array of these hashes
    #
    def parse_csv_file params
      array = []
      if params[:file]
        file = params[:file][:tempfile]
        
        CSV.foreach(file, { headers: true, converters: :numeric }) do |row|
          array << Hash[row.to_hash.map{|(k,v)| [k.to_sym,v]}]
        end
      end
      array
    end
    
    # Create a startlist from a CSV formatted file
    # Assume that the CSV file contains the following data:
    # per_id, start_order
    # Thie method assumes that wet_id, grp_id and route parameters are also provided
    # which are merged into the default object and passed to the create_startlist method
    # 
    post '/import' do
      list = parse_csv_file({ file: params.delete("file") })
      
      args = defaults.merge Hash[params.map{ |(k,v)| [k.to_sym,v] }]
      create_startlist(args, list)
      200
    end
    
    # Create a startlist from existing results - see create_from_cwif_results for arguments
    post '/cwif' do
      args = defaults.merge Hash[params.map{ |(k,v)| [k.to_sym,v.to_i] }]
      create_from_cwif_results(args)
      200
    end
    
    # Create a startlist from existing results - see create_from_ifsc_results for arguments
    post  '/ifsc' do
      args = defaults.merge Hash[params.map{ |(k,v)| [k.to_sym,v.to_i] }]
      create_from_ifsc_results(args)
      200
    end
  end
end