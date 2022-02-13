require 'dry-types'

module Types
  include Dry.Types()
end

module QueryType
  module_function

  # rubocop:disable AlignHash
  def person
    Types::Hash.schema(lastname:  Types::Strict::String,
                       firstname: Types::Strict::String,
                       nation:    Types::Strict::String.meta(omittable: true)
               .with_key_transform(&:to_sym))
  end

  def result
    Types::Hash.schema(wet_id: Types::Coercible::Integer,
                       grp_id: Types::Coercible::Integer,
                       route:  Types::Coercible::Integer.default(-1),
                       per_id: Types::Coercible::Integer.meta(omittable: true),
                       locked: Types::Strict::Bool.meta(omittable: true))
               .with_key_transform(&:to_sym)
  end

  def competition
    Types::Hash.schema(wet_id: Types::Coercible::Integer,
                       city:   Types::Strict::String,
                       date:   Types::Coercible::String,
                       type:   Types::Strict::String,
                       title:  Types::Strict::String)
               .with_key_transform(&:to_sym)
  end
  # rubocop:enable AlignHash
end

# test = { firstname: 123, lastname: 'bacher' }
#
# begin
#  args = QueryType.person[test]
#  p args
# rescue StandardError
#  p 'error'
# end
# p QueryType.result[wet_id: 12, grp_id: '3']
# p QueryType.result['wet_id' => 12, 'grp_id' => '3']
