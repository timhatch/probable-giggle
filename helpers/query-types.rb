# frozen_string_literal: true

require 'dry-types'

module Types
  include Dry.Types()
end

module QueryType
  module_function

  def person
    Types::Hash.schema(lastname: Types::Strict::String,
                       firstname: Types::Strict::String,
                       gender: Types::Strict::String,
                       birthyear: Types::Coercible::Integer,
                       nation: Types::Strict::String,
                       club: Types::Strict::String.meta(omittable: true),
                       active: Types::Strict::Bool.meta(omittable: true))
               .with_key_transform(&:to_sym)
  end

  def starter
    Types::Hash.schema(wet_id: Types::Coercible::Integer,
                       grp_id: Types::Coercible::Integer,
                       route: Types::Coercible::Integer.default(0),
                       per_id: Types::Coercible::Integer,
                       bib_nr: Types::Coercible::Integer.meta(omittable: true),
                       start_order: Types::Coercible::Integer.meta(omittable: true),
                       rank_prev_heat: Types::Coercible::Integer.meta(omittable: true))
               .with_key_transform(&:to_sym)
  end

  def result
    Types::Hash.schema(wet_id: Types::Coercible::Integer,
                       grp_id: Types::Coercible::Integer,
                       route: Types::Coercible::Integer.default(-1),
                       per_id: Types::Coercible::Integer.meta(omittable: true),
                       locked: Types::Strict::Bool.meta(omittable: true))
               .with_key_transform(&:to_sym)
  end

  def competition
    Types::Hash.schema(wet_id: Types::Coercible::Integer,
                       city: Types::Strict::String,
                       date: Types::Coercible::String,
                       type: Types::Strict::String,
                       title: Types::Strict::String)
               .with_key_transform(&:to_sym)
  end
end

# rubocop:disable Style/BlockComments
=begin
people = [
  {wet_id: 12, grp_id: 3, route: 3, per_id: 3, firstname: 'tim', bib_nr: 4},
  {wet_id: 13, grp_id: 3, route: 3, per_id: 3, firstname: 'tim', bib_nr: 4}
]

p people.each(&QueryType.starter)
=end
# rubocop:enable Style/BlockComments
