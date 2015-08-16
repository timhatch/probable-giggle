# Self-join within SQLITE
select t1.PerId, t1.name, t2.comp1 from result1 t1 left outer join result1 t2 on t1.PerId = t2.PerId

CREATE TABLE Results (ResId INTEGER PRIMARY KEY, WetId INTEGER, PerId INTEGER, GrpId INTEGER, 
RndId INTEGER, BibNr INTEGER, StartNr INTEGER, ResString TEXT, ResSummary TEXT, RankParam INTEGER DEFAULT 0, Rank INTEGER);

# Order by rank from a single parameter within SQLITE using a self-join

select t1.PerId, t1.name, t1.comp1, count() as rank
from result1 t1, result1 t2
where t1.comp1 < t2.comp1 or (t1.PerId = t2.PerId and t1.comp1 = t2.comp1)
group by t1.PerId, t1.name
order by rank asc

# Order by rank from two parameters
select t1.PerId as _perid, count() as _rank
from result1 t1, result1 t2
where 
	(t1.comp1 < t2.comp1)
	or (t1.comp1 = t2.comp1 and t1.comp2 < t2.comp2)
	or (t1.PerId = t2.PerId and t1.comp1 = t2.comp1)
group by t1.PerId, t1.category
order by _rank asc

# Order by rank for a given category
select t1.PerId as _perid, count() as _rank
from (select * from result1 where category = 'f') t1, (select * from result1 where category = 'f') t2
where 
	(t1.comp1 < t2.comp1)
	or (t1.comp1 = t2.comp1 and t1.comp2 < t2.comp2)
	or (t1.PerId = t2.PerId and t1.comp1 = t2.comp1)
group by t1.PerId
order by _rank asc


#
select test.PerId, _rank from (select t1.PerId as _perid, count() as _rank
from result1 t1, result1 t2
where 
	(t1.comp1 < t2.comp1)
	or (t1.comp1 = t2.comp1 and t1.comp2 < t2.comp2)
	or (t1.PerId = t2.PerId and t1.comp1 = t2.comp1)
group by t1.PerId, t1.name
order by _rank asc) t3
join test on test.PerId = t3._perid

CREATE table temp as select t1.PerId as _perid, count() as _rank from result1 t1, result1 t2 where (t1.comp1 < t2.comp1) or (t1.comp1 = t2.comp1 and t1.comp2 < t2.comp2) or (t1.PerId = t2.PerId and t1.comp1 = t2.comp1) group by t1.PerId;

UPDATE test SET rank = (SELECT _rank FROM temp WHERE _perid = test.PerId);