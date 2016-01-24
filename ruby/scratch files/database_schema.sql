# NOTE: Replace the access to the Table :Results  by a View created so:
CREATE VIEW "Ranking" AS
SELECT
  wet_id,grp_id,route,
  per_id,lastname,firstname,nation,
  result,result_json,rank_prev_heat,start_order,
  rank() OVER (PARTITION BY wet_id,grp_id,route ORDER BY sort_values[1] DESC NULLS LAST, sort_values[2] ASC, sort_values[3] DESC, sort_values[4] ASC, rank_prev_heat ASC) AS result_rank
FROM "Results" 
JOIN "Climbers" USING (per_id)

# This would be more efficient?
CREATE VIEW "Ranking" AS 
SELECT
  "wet_id","grp_id","route",
  "per_id", "lastname","firstname","nation","GrpId", "route", 
  "result","result_json", "rank_param","rank_prev_heat", "start_order"
FROM "Results" JOIN "Climbers" USING ("PerId") 

With the rank() a calcuated in a sequel query
# i.e. the calculation is performed for only a single competition
.where(params)
.select{rank.over(:order => result_rank)}



ALTER TABLE "Results" ADD COLUMN "sort_array" INTEGER[4]


CREATE FUNCTION setresult(arr integer[]) returns void as $$ update "Results" SET "result" = arr[1] || 't' ||arr[2]; $$ language 'sql';

CREATE TRIGGER updateresult AFTER UPDATE OF sort_values ON "Results" 
FOR EACH ROW EXECUTE PROCEDURE setresult(sort_values);

  
  CREATE OR REPLACE FUNCTION setresult(sort_values integer[]) RETURNS void
  AS 'UPDATE "Results" SET start_order = sort_values[1];' 
  LANGUAGE SQL; 
  CREATE TRIGGER updateresult AFTER UPDATE OF sort_values ON "Results" 
  FOR EACH ROW EXECUTE PROCEDURE setresult(sort_values);