#!/usr/bin/ruby
#
participants = [{ per_id: 1030 }, { per_id: 6230 }, { per_id: 1031 }, { per_id: 6550 }]

routes = [
  [{ per_id: 1031, rank: 4 }, { per_id: 6550, rank: 2 }],
  [{ per_id: 1030, rank: 1 }, { per_id: 6230, rank: 3, route: 2 }],
  [{ per_id: 1030, rank: 2 }, { per_id: 6230, rank: 1 }, { per_id: 6550, rank: 3, route: 1 }]
]

# METHOD A
# out = participants.each do |starter|
#   routes.map do |route|
#     a = route.select { |x| x[:per_id].equal? starter[:per_id] }
#     starter.merge!(general: a.first[:rank]) unless a.empty?
#   end
# end
# out.flatten

# METHOD B - Use each_with_object
# FIXME: This isn't going to work as with 2 starting groups as the 1/2 quota means that
#        non-qualified competitots will have a better rank than some semi-finalists. i.e.
#        Best non-qualifiying rank = 11, worst sem-final rank = 20
#        Possibly acceptable for startlist creation given 20 (10) => 6, but mathematically
#        impure
#        Ergo, we need to perform some additional step on the results of routes 0 and 1
routes.flatten
      .each_with_object({}) { |res, obj| obj[res[:per_id]] = res[:rank] }
      .map { |k, v| Hash[per_id: k, general: v] }

#p routes.flatten.sort_by(:rank) 
