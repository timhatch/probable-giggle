require 'httparty'
require 'json'
require 'date'

# Test Data
# XYZ M Bouldering GrpId=63,, PerIds=8153,8173
# XYZ F Bouldering GrpId=284, PerIds=61104, 50691
data = { request: {
  parameters: [{ 
    WetId: 1572, GrpId: 284, route: 0, PerId: 11709,
    boulder: 1, try: 2, top: nil, bonus: 1,
    updated: DateTime.now.new_offset(Rational(0,24)).to_s
  }]
}}

# Submit some results
def send_request authorisation, data
  url     = 'https://ifsc.egroupware.net/egw/json.php' 
  options = Hash[ 
    query: { menuaction: 'ranking.ranking_boulder_measurement.ajax_protocol_update', 
             json_data: JSON.generate(data) },
    headers: authorisation ]
  HTTParty.post(url, options)
end

# Use an active sessionid as thw authrisation
auth = { 'Cookie' => 'sessionid=qo5tji64a1cvobtkddnjktlth0' }
# Use a hashed basic authorisation userid:password combination
#auth = { 'Authorization' => 'Basic dGltOm1vY2twbzIwMTQ=' }
# To produce a has from the login/password combination we need to require 'base64' and
# Base64.strict_encode 'tim:mockpo2014'
resp = send_request(auth, data)
puts resp.code
puts resp.body


# url = 'https://ifsc.egroupware.net/egw/login.php'
# credentials = Hash[
#   passwd_type: 'text', account_type: 'u', logindomain: 'ifsc-climbing.org',
#   login: 'tim', passwd: 'mockpo2014'
# ]

#n = HTTParty.post url, { body: credentials }
#p n.code
#puts n.body
#p jar = n.request.options[:headers]['Cookie']

# data = {"request": {
#     "parameters":[{
#         "WetId":"1572",
#         "GrpId":"63",
#         "route":"0",
#         "PerId":"9017",
#         "boulder":"1",
#         "try":1,
#         "top":"",
#         "bonus":"0",
#         "updated":"2016-10-29T19:15:59.037Z"
#     }]
# }}