# Use a view to create a composite of the data needed for external apps
# instead of using joins in a sequel query
CREATE VIEW "Ranking" AS
SELECT
  wet_id,grp_id,route,
  per_id,lastname,firstname,nation,
  (CAST(sort_values[1] AS TEXT) || 't' || CAST(sort_values[2] AS TEXT) || ' ' || CAST(sort_values[3] AS TEXT) || 'b' || CAST(sort_values[4] AS TEXT)) AS result,
  result_json,rank_prev_heat,start_order,
  rank() OVER (PARTITION BY wet_id,grp_id,route ORDER BY sort_values[1] DESC NULLS LAST, sort_values[2] ASC, sort_values[3] DESC, sort_values[4] ASC, rank_prev_heat ASC) AS result_rank
FROM "Results" 
JOIN "Climbers" USING (per_id)

# This would be more efficient to calculate the rank() in a sequel query
# i.e. the calculation is performed for only a single competition
.where(params)
.select{rank.over(:order => result_rank)}


# Add a column havng integer Array type
ALTER TABLE "Results" ADD COLUMN "sort_array" INTEGER[4]

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