# NOTE: Replace the access to the Table :Results  by a View created so:
CREATE VIEW "Ranking" AS
SELECT
  "wet_id","grp_id","route",
  "per_id","lastname","firstname","nation",
  "result","result_json", "rank_prev_heat", "start_order",
  rank() OVER (PARTITION BY "wet_id","grp_id","route" ORDER BY "rank_param" DESC, "rank_prev_heat" ASC) AS "result_rank"
FROM "Results" JOIN "Climbers" USING ("per_id")  

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

per_id
wet_id
grp_id