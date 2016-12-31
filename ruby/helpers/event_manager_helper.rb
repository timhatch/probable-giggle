
# Module  Perseus                 - The namespace for all application code
# Module  ResultsHandler          - Helper methods to handle resultss
#
module Perseus
  # LANStorageAPI
  module ResultsHandler
    module_function

    # Handle a results update coming into the local server
    #
    def handle_results_input params
      # Update the local server
      LANStorageAPI.set_result_person(params)
      # Broadcast the input result to localhost
      #
      # Broadcast the input result to localhost
      #
      # Broadcast the aggregated result to localhost
      #
    end
  end
end
