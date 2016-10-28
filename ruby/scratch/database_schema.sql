# Use a view to create a composite of the data needed for external apps
# instead of using joins in a sequel query
CREATE VIEW "Ranking" AS
SELECT
  wet_id,grp_id,route,
  per_id,lastname,firstname,nation,
  (CAST(sort_values[1] AS TEXT) || 't' || CAST(sort_values[2] AS TEXT) || ' ' || CAST(sort_values[3] AS TEXT) || 'b' || CAST(sort_values[4] AS TEXT)) AS result,
  result_json,rank_prev_heat,start_order,sort_values,
  rank() OVER (PARTITION BY wet_id,grp_id,route ORDER BY sort_values[1] DESC NULLS LAST, sort_values[2] ASC, sort_values[3] DESC, sort_values[4] ASC, rank_prev_heat ASC) AS result_rank
FROM "Results" 
JOIN "Climbers" USING (per_id)

# Query whether it would be more efficient to calculate the rank() in a sequel query
# i.e. the calculation is performed for set paramaters
.where(params)
.select{rank.function
  .over(:order => [
    Sequel.desc(Sequel.pg_array_op(:sort_values)[1], :nulls=>:last),
    Sequel.pg_array_op(:sort_values)[2],
    Sequel.desc(Sequel.pg_array_op(:sort_values)[3]),
    Sequel.pg_array_op(:sort_values)[3],
    :rank_prev_heat
  ])}


# Add a column havng integer Array type
ALTER TABLE "Results" ADD COLUMN "sort_values" INTEGER[4]
ALTER TABLE "Results" ADD COLUMN "result_json" TEXT DEFAULT '{}'

# Triggers in POSTGRESQL use functions, like so...
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