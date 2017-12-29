#
# Calculate result_rank on querying results
#
# Method A - Use a view.
# + faster
# - hardwires ranking methodology into the database

CREATE VIEW "BoulderRanking" AS
SELECT
  wet_id, grp_id, route, locked,
  per_id, lastname, firstname, nation, 
  (CAST(sort_values[1] AS TEXT) || 't' || CAST(sort_values[2] AS TEXT) || ' ' || CAST(sort_values[3] AS TEXT) || 'b' || CAST(sort_values[4] AS TEXT)) AS result,
  result_jsonb, rank_prev_heat, start_order, sort_values,
  rank() OVER (PARTITION BY wet_id, grp_id, route ORDER BY sort_values[1] DESC NULLS LAST, sort_values[2] ASC, sort_values[3] DESC, sort_values[4] ASC, rank_prev_heat ASC) AS result_rank
FROM "Results"
JOIN "Climbers" USING (per_id)
WHERE locked IS false

# Method B - Create the ranking on the fly when querying.
# + more flexible?
# - slower

DB[:Results]
.join(:Climbers, [:per_id])
.where(params)
.select(:per_id, :lastname, :firstname, :nation, :start_order, :rank_prev_heat, :sort_values, :result_jsonb)
.select_append{
  rank.function.over(
    partition: [:wet_id, :grp_id: route],
    order: [
      Sequel.desc(Sequel.pg_array_op(:sort_values)[1], :nulls=>:last),
      Sequel.pg_array_op(:sort_values)[2],
      Sequel.desc(Sequel.pg_array_op(:sort_values)[3]),
      Sequel.pg_array_op(:sort_values)[3],
      :rank_prev_heat
    ]
  ).as(:result_rank)
}

# Postgres column types
#
# Add a column of type integer Array
ALTER TABLE "Results" ADD COLUMN "sort_values" INTEGER[4]
# Add a column of type jsonb type
ALTER TABLE "Results" ADD COLUMN "result_jsonb" jsonb

# Postgres triggers 
#
# Triggers in POSTGRESQL use functions, like so...
#
CREATE OR REPLACE FUNCTION test_function()
  RETURNS trigger AS
  $BODY$
  BEGIN
  UPDATE "Results" SET test = CAST(sort_values[1] AS TEXT) || 't';
  RETURN null;
  END;
  $BODY$
  LANGUAGE plpgsql VOLATILE
  
CREATE TRIGGER test_trigger AFTER UPDATE OF route ON "Results" FOR EACH ROW EXECUTE PROCEDURE test_function();

# To remove/delete/drop
DROP FUNCTION test_function()
DROP TRIGGER test_trigger on "Results"

# Creating Startlists
#
SELECT * FROM "Ranking" WHERE wet_id=? AND grp_id=? AND route=? AND result_rank<(QUOTA+1) ORDER BY result_rank ASC
