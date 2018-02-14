-- This file contains SQL snippets and corresponding/complimentary Sequel snippets
-- The contents are as much an aide-memoire as anything


-- DYNAMIC RANKING METHODS
--
-- Calculate result_rank on querying results
-- Note that both methods here use the pre-2018 ranking methodology

-- Method A - Use a view.
-- + faster?
-- + may allow single queries to be made TBC
-- - hardwires ranking methodology into the database
--
CREATE VIEW "BoulderRanking" AS
SELECT
  wet_id, grp_id, route, locked,
  per_id, lastname, firstname, nation, 
  result_jsonb, rank_prev_heat, start_order, sort_values,
  rank() OVER (PARTITION BY wet_id, grp_id, route ORDER BY sort_values[1] DESC NULLS LAST, sort_values[2] ASC, sort_values[3] DESC, sort_values[4] ASC, rank_prev_heat ASC) AS result_rank
FROM "Results"
JOIN "Climbers" USING (per_id)
WHERE locked IS false

-- Method B - Create the ranking on the fly when querying.
-- + more flexible?
-- - slower?
-- - result_rank can only be calculated where a full route is queried, if a single resukt is retrieved then result_rank is always 1
--   because the partition over which rank is created is just the one climber
--
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


-- CASTING DATA IN POSTGRESQL
--
-- Translate the sort_values array into a string representation of the result (pre-2018 ranking method)
--
SELECT per_id, (CAST(sort_values[1] AS TEXT) || 't' || CAST(sort_values[2] AS TEXT) || ' ' || CAST(sort_values[3] AS TEXT) || 'b' || CAST(sort_values[4] AS TEXT)) AS result
FROM "Results"
WHERE...


-- ADDING COMPLEX DATA TYPES
--
-- Add a column of type (integer Array)
ALTER TABLE "Results" ADD COLUMN "sort_values" INTEGER[4]
-- Add a column of type (jsonb)
ALTER TABLE "Results" ADD COLUMN "result_jsonb" jsonb


-- USING TRIGGERS IN POSTGRESQL
--
-- Example of how to use triggers in POSTGRES
-- Triggers can be run BEFORE, AFTER or INSTEAD OF one of the following events:
-- INSERT UPDATE DELETE TRUNCATE
-- Triggers can be run FOR EACH ROW or once per statement (default) via FOR EACH STATEMENT
-- Triggers in POSTGRESQL use functions, like so...
--
CREATE TRIGGER test_trigger 
AFTER UPDATE OF route ON "Results" 
FOR EACH ROW 
EXECUTE PROCEDURE my_function();

-- The POSTGRESQL manual gives the following example:
CREATE OR REPLACE FUNCTION log_last_name_changes()
  RETURNS trigger AS
$BODY$
BEGIN
 IF NEW.last_name <> OLD.last_name THEN
 INSERT INTO employee_audits(employee_id,last_name,changed_on)
 VALUES(OLD.id,OLD.last_name,now());
 END IF;
 RETURN NEW;
END;
$BODY$

-- some web examples however require a language to be associated with the function
CREATE OR REPLACE FUNCTION myfunction()
  RETURNS trigger AS
$BODY$
BEGIN
  UPDATE "Results" SET test_column = CAST(sort_values[1] AS TEXT) || 't';
  RETURN null;
END;
$BODY$
LANGUAGE plpgsql VOLATILE
  
-- To remove/delete/drop
DROP FUNCTION myfunction()
DROP TRIGGER test_trigger on "Results"


-- CREATING STARTLISTS FROM EXISTING DATA
-- Creating Startlists
INSERT OR REPLACE INTO "Results" FROM
(SELECT * FROM "Results" WHERE wet_id=? AND grp_id=? AND route=? AND rank_this_heat<(QUOTA+1) 
  ORDER BY rank_this_heat ASC)


-- INSERT A RANK INTO THE RESULTS TABLE
--
-- POSTGRESQL query to calculate and insert a rank (rank_this_heat) using a window function
-- This is a similar concept to dynamic rank calculation
--
UPDATE "Results" r 
SET rank_this_heat = calc_rank 
FROM (
  SELECT 
    per_id, 
    rank() 
    OVER (
      PARTITION BY 
        wet_id, 
        grp_id, 
        route 
      ORDER BY 
        sort_values[1] DESC NULLS LAST, sort_values[2] ASC, sort_values[3] DESC, sort_values[4] ASC, rank_prev_heat ASC
    ) AS calc_rank FROM "Results" r
  ) rr
WHERE r.wet_id=31 AND r.route=2 AND r.per_id = rr.per_id

-- The simplest implementation of the above in Sequel would follow the following:
data = DB[:Results].where(params)

data.select(:per_id)
    .select_append {
      rank.function.over(
        partition: [:wet_id, :grp_id, :route],
        order: [
          Sequel.desc(Sequel.pg_array_op(:sort_values)[1], :nulls=>:last),
          Sequel.pg_array_op(:sort_values)[2],
          Sequel.desc(Sequel.pg_array_op(:sort_values)[3]),
          Sequel.pg_array_op(:sort_values)[3],
          :rank_prev_heat
        ]
      ).as(:result_rank)
    }
    .each { |x| data.where(per_id: x[:per_id]).update(rank_this_heat: x[:result_rank]) }
-- there may be more efficient means of doing this, the above method relies on Sequel datasets 
-- being iterable objects in Ruby. But as a corollary, it infers that this emthod will make n 
-- serial writes to the database.
-- There may be a better way of doing this
-- We can also extract the ranking function into a separate method, e.g.

def self.rank 
  Sequel.function(:rank).over(        
    partition: [:wet_id, :grp_id, :route],
    order: [
      Sequel.desc(Sequel.pg_array_op(:sort_values)[1], :nulls=>:last),
      Sequel.pg_array_op(:sort_values)[2],
      Sequel.desc(Sequel.pg_array_op(:sort_values)[3]),
      Sequel.pg_array_op(:sort_values)[3],
      :rank_prev_heat
    ]
  ).as(:result_rank)
end

data = DB[:Results].where(params)
data.select(:per_id)
    .select_append(&method(:rank))
    .each { |x| data.where(per_id: x[:per_id]).update(rank_this_heat: x[:result_rank]) }
    
-- USE A FILTER TO SCREEN OUT JUNIORS (CWIF)
-- date = Sequel.cast(Date.today,DateTime)
-- year = Sequel.extract(:year, date).cast(Integer)
year    = Sequel.cast(Date.today, DateTime).extract(:year).cast(Integer)
juniors = DB[:Climbers].where{birthyear > year - 19}


