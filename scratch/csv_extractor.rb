require 'httparty'
require 'json'

@grp_id = 5
@params = { wet_id: 99, grp_id: @grp_id, route: 2 }
@url    = 'http://localhost:9292/results/route'

# Convert the resuluts_jsonb data into an array ov values
# NOTE: No explicit check is made as to the order, we presume that the order of boulders
# is always p1, p2... and within each always a, b, t
#
def results_to_array result_jsonb
  if result_jsonb.nil?
    []
  else
    result_jsonb.map { |_k, v| v.values }
  end
end

# Fetch a response from the results service
response = HTTParty.get(@url, query: @params)
data = response.code == 200 ? JSON.parse(response.body) : nil

# Convert the response and write to a csv file
CSV.open("./results_#{@grp_id}.csv", 'wb') do |csv|
  data.map do |person|
    person.delete('sort_values')
    results_data = results_to_array(person.delete('result_jsonb'))
    csv << person.values.concat(results_data).flatten
  end
end

# File.open('./test.csv', 'wb:UTF-16LE') { |f| f.puts '\uFFEFI am a UTF-16 file' }

# Convert the response into a CSV string
# csv_output = CSV.generate do |csv|
#   data.map do |person|
#     person.delete('sort_values')
#     results_data = results_to_array(person.delete('result_jsonb'))
#     csv << person.values.concat(results_data).flatten
#   end
# end
#
# # Print the string to standard output
# puts csv_output.encode('UTF-16', invalid: :replace, replace: '').encode('UTF-8')
#
# File.open('./test.csv', 'wb:UTF-16LE') do |f|
#   f.puts csv_output.encode('UTF-16', invalid: :replace, replace: '').encode('UTF-8')
# end
