# USING httpie
# GET with single parameter
http :9292/competition?wet_id=1

# GET with multiple parameters
http GET :9292/climber wet_id=1 route=2 grp_id=5 start_order=1

# PUT wuth single or multiple parameters
http :9292/climber wet_id=1 route=2 grp_id=5 start_order=1
