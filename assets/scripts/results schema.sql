/* Data schema */
CREATE TABLE "data" ("PerId" integer NULL DEFAULT 0, "name" varchar(20) NULL, "code" varchar(4) NULL, "category" varchar(1) NULL, "b1" integer NULL DEFAULT 0, "b2" integer NULL DEFAULT 0, "b3" integer NULL DEFAULT 0, "b4" integer NULL DEFAULT 0, "b5" integer NULL DEFAULT 0, "b6" integer NULL DEFAULT 0, "b7" integer NULL DEFAULT 0, "b8" integer NULL DEFAULT 0, "b9" integer NULL DEFAULT 0, "b10" integer NULL DEFAULT 0, "b11" integer NULL DEFAULT 0, "b12" integer NULL DEFAULT 0, "b13" integer NULL DEFAULT 0, "b14" integer NULL DEFAULT 0, "b15" integer NULL DEFAULT 0, "b16" integer NULL DEFAULT 0, "b17" integer NULL DEFAULT 0, "b18" integer NULL DEFAULT 0, "b19" integer NULL DEFAULT 0, "b20" integer NULL DEFAULT 0, "b21" integer NULL DEFAULT 0, "b22" integer NULL DEFAULT 0, "b23" integer NULL DEFAULT 0, "b24" integer NULL DEFAULT 0, "b25" integer NULL DEFAULT 0, "b26" integer NULL DEFAULT 0, "b27" integer NULL DEFAULT 0, "b28" integer NULL DEFAULT 0, "b29" integer NULL DEFAULT 0, "b30" integer NULL DEFAULT 0);


CREATE TABLE "result1" ("PerId" integer NULL DEFAULT 0, "name" varchar(20) NULL, "code" varchar(4) NULL, "category" varchar(1) NULL, "b1" decimal(38.18) DEFAULT 0.0, "b2" decimal(38.18) DEFAULT 0.0, "b3" decimal(38.18) DEFAULT 0.0, "b4" decimal(38.18) DEFAULT 0.0, "b5" decimal(38.18) DEFAULT 0.0, "b6" decimal(38.18) DEFAULT 0.0, "b7" decimal(38.18) DEFAULT 0.0, "b8" decimal(38.18) DEFAULT 0.0, "b9" decimal(38.18) DEFAULT 0.0, "b10" decimal(38.18) DEFAULT 0.0, "b11" decimal(38.18) DEFAULT 0.0, "b12" decimal(38.18) DEFAULT 0.0, "b13" decimal(38.18) DEFAULT 0.0, "b14" decimal(38.18) DEFAULT 0.0, "b15" decimal(38.18) DEFAULT 0.0, "b16" decimal(38.18) DEFAULT 0.0, "b17" decimal(38.18) DEFAULT 0.0, "b18" decimal(38.18) DEFAULT 0.0, "b19" decimal(38.18) DEFAULT 0.0, "b20" decimal(38.18) DEFAULT 0.0, "b21" decimal(38.18) DEFAULT 0.0, "b22" decimal(38.18) DEFAULT 0.0, "b23" decimal(38.18) DEFAULT 0.0, "b24" decimal(38.18) DEFAULT 0.0, "b25" decimal(38.18) DEFAULT 0.0, "b26" decimal(38.18) DEFAULT 0.0, "b27" decimal(38.18) DEFAULT 0.0, "b28" decimal(38.18) DEFAULT 0.0, "b29" decimal(38.18) DEFAULT 0.0, "b30" decimal(38.18) DEFAULT 0.0, "comp1" decimal(38.18) DEFAULT 0.0, "comp2" decimal(38.18) DEFAULT 0.0);

CREATE TABLE "result2" ("PerId" integer NULL DEFAULT 0, "name" varchar(20) NULL, "code" varchar(4) NULL, "category" varchar(1) NULL, "b1" decimal(38.18) DEFAULT 0.0, "b2" decimal(38.18) DEFAULT 0.0, "b3" decimal(38.18) DEFAULT 0.0, "b4" decimal(38.18) DEFAULT 0.0, "b5" decimal(38.18) DEFAULT 0.0, "b6" decimal(38.18) DEFAULT 0.0, "b7" decimal(38.18) DEFAULT 0.0, "b8" decimal(38.18) DEFAULT 0.0, "b9" decimal(38.18) DEFAULT 0.0, "b10" decimal(38.18) DEFAULT 0.0, "b11" decimal(38.18) DEFAULT 0.0, "b12" decimal(38.18) DEFAULT 0.0, "b13" decimal(38.18) DEFAULT 0.0, "b14" decimal(38.18) DEFAULT 0.0, "b15" decimal(38.18) DEFAULT 0.0, "b16" decimal(38.18) DEFAULT 0.0, "b17" decimal(38.18) DEFAULT 0.0, "b18" decimal(38.18) DEFAULT 0.0, "b19" decimal(38.18) DEFAULT 0.0, "b20" decimal(38.18) DEFAULT 0.0, "b21" decimal(38.18) DEFAULT 0.0, "b22" decimal(38.18) DEFAULT 0.0, "b23" decimal(38.18) DEFAULT 0.0, "b24" decimal(38.18) DEFAULT 0.0, "b25" decimal(38.18) DEFAULT 0.0, "b26" decimal(38.18) DEFAULT 0.0, "b27" decimal(38.18) DEFAULT 0.0, "b28" decimal(38.18) DEFAULT 0.0, "b29" decimal(38.18) DEFAULT 0.0, "b30" decimal(38.18) DEFAULT 0.0, "comp1" decimal(38.18) DEFAULT 0.0, "comp2" decimal(38.18) DEFAULT 0.0);

/* Copy/Delete table triggers */

CREATE TRIGGER copy_insert AFTER INSERT ON data
BEGIN
INSERT INTO result1 (PerId, name, code, category) SELECT PerId, name, code, category FROM data WHERE NOT EXISTS (SELECT * FROM result1 WHERE result1.PerId=data.PerId);
INSERT INTO result2 (PerId, name, code, category) SELECT PerId, name, code, category FROM data WHERE NOT EXISTS (SELECT * FROM result2 WHERE result2.PerId=data.PerId);
END;

CREATE TRIGGER copy_delete AFTER DELETE ON data
BEGIN
DELETE FROM result1 WHERE NOT EXISTS (SELECT * FROM data WHERE result1.PerId=data.PerId);
DELETE FROM result2 WHERE NOT EXISTS (SELECT * FROM data WHERE result2.PerId=data.PerId);
END;

/* Computed Results triggers */

CREATE TRIGGER result1_comp1 AFTER UPDATE OF b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15, b16, b17, b18, b19, b20, b21, b22, b23, b24, b25, b26, b27, b28, b29, b30 ON result1 
BEGIN 
UPDATE result1 SET comp1 = (b1 + b2 + b3 + b4 + b5 + b6 + b7 + b8 + b9 + b10 + b11 + b12 + b13 + b14 + b15 + b16 + b17 + b18 + b19 + b20 + b21 + b22 + b23 + b24 + b25 + b26 + b27 + b28 + b29 + b30) WHERE PerId=old.PerId; 
END;



/*
*
*	NOT USED
*
*/






/* For a single cell */
CREATE TRIGGER test AFTER UPDATE OF b1 ON data 
BEGIN 
UPDATE result1 SET b1 = (SELECT b1 FROM data WHERE PerId=result1.PerId);
UPDATE result1 SET b1 = (CASE WHEN b1>1 THEN b1+0.01 WHEN b1=1 THEN 0.01 ELSE 0 END) WHERE PerId=result1.PerId;
END;

 WHERE PerId = result1.PerId
 
 
UPDATE result1 SET b1 = (SELECT b1 FROM data WHERE PerId = result1.PerId); 


UPDATE result1 SET b1 = (CASE WHEN data.b1>1 THEN data.b1+0.01 WHEN data.b1=1 THEN 0.01 ELSE 0 END) WHERE PerId = data.PerId; 

/* For a single cell, and update the aggregate score */
CREATE TRIGGER method1_b1 UPDATE OF b1 ON results 
BEGIN 
	UPDATE results SET x1 = (CASE WHEN new.b1>1 THEN new.b1+0.01 WHEN new.b1=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
	UPDATE results SET res_01 = (x1 + x2 + x3 + x4 + x5 + x6 + x7 + x8 + x9 + x10 + x11 + x12 + x13 + x14 + x15 + x16 + x17 + x18 + x19 + x20 + x21 + x22 + x23 + x24 + x25 + x26 + x27 + x28 + x29 + x30) WHERE PerId=old.PerId; 
END;

/* For any result cell and update the aggregate score */
CREATE TRIGGER result_01 UPDATE OF b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15, b16, b17, b18, b19, b20, b21, b22, b23, b24, b25, b26, b27, b28, b29, b30 ON results BEGIN 
UPDATE results SET x1 = (CASE WHEN new.b1>1 THEN new.b1+0.01 WHEN new.b1=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x2 = (CASE WHEN new.b2>1 THEN new.b2+0.01 WHEN new.b2=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x3 = (CASE WHEN new.b3>1 THEN new.b3+0.01 WHEN new.b3=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x4 = (CASE WHEN new.b4>1 THEN new.b4+0.01 WHEN new.b4=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x5 = (CASE WHEN new.b5>1 THEN new.b5+0.01 WHEN new.b5=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x6 = (CASE WHEN new.b6>1 THEN new.b6+0.01 WHEN new.b6=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x7 = (CASE WHEN new.b7>1 THEN new.b7+0.01 WHEN new.b7=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x8 = (CASE WHEN new.b8>1 THEN new.b8+0.01 WHEN new.b8=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x9 = (CASE WHEN new.b9>1 THEN new.b9+0.01 WHEN new.b9=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x10 = (CASE WHEN new.b10>1 THEN new.b10+0.01 WHEN new.b10=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x11 = (CASE WHEN new.b11>1 THEN new.b11+0.01 WHEN new.b11=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x12 = (CASE WHEN new.b12>1 THEN new.b12+0.01 WHEN new.b12=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x13 = (CASE WHEN new.b13>1 THEN new.b13+0.01 WHEN new.b13=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x14 = (CASE WHEN new.b14>1 THEN new.b14+0.01 WHEN new.b14=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x15 = (CASE WHEN new.b15>1 THEN new.b15+0.01 WHEN new.b15=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x16 = (CASE WHEN new.b16>1 THEN new.b16+0.01 WHEN new.b16=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x17 = (CASE WHEN new.b17>1 THEN new.b17+0.01 WHEN new.b17=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x18 = (CASE WHEN new.b18>1 THEN new.b18+0.01 WHEN new.b18=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x19 = (CASE WHEN new.b19>1 THEN new.b19+0.01 WHEN new.b19=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x20 = (CASE WHEN new.b20>1 THEN new.b20+0.01 WHEN new.b20=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x21 = (CASE WHEN new.b21>1 THEN new.b21+0.01 WHEN new.b21=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x22 = (CASE WHEN new.b22>1 THEN new.b22+0.01 WHEN new.b22=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x23 = (CASE WHEN new.b23>1 THEN new.b23+0.01 WHEN new.b23=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x24 = (CASE WHEN new.b24>1 THEN new.b24+0.01 WHEN new.b24=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x25 = (CASE WHEN new.b25>1 THEN new.b25+0.01 WHEN new.b25=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x26 = (CASE WHEN new.b26>1 THEN new.b26+0.01 WHEN new.b26=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x27 = (CASE WHEN new.b27>1 THEN new.b27+0.01 WHEN new.b27=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x28 = (CASE WHEN new.b28>1 THEN new.b28+0.01 WHEN new.b28=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x29 = (CASE WHEN new.b29>1 THEN new.b29+0.01 WHEN new.b29=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x30 = (CASE WHEN new.b30>1 THEN new.b30+0.01 WHEN new.b30=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET res_01 = (x1 + x2 + x3 + x4 + x5 + x6 + x7 + x8 + x9 + x10 + x11 + x12 + x13 + x14 + x15 + x16 + x17 + x18 + x19 + x20 + x21 + x22 + x23 + x24 + x25 + x26 + x27 + x28 + x29 + x30) WHERE PerId=old.PerId; 
END;





CREATE TRIGGER method1_b1 UPDATE OF b1 ON results 
BEGIN 
UPDATE results SET x1 = (CASE WHEN new.b1>1 THEN new.b1+0.01 WHEN new.b1=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET res_01 = (x1 + x2 + x3 + x4 + x5 + x6 + x7 + x8 + x9 + x10 + x11 + x12 + x13 + x14 + x15 + x16 + x17 + x18 + x19 + x20 + x21 + x22 + x23 + x24 + x25 + x26 + x27 + x28 + x29 + x30) WHERE PerId=old.PerId; 
END;








select name from data where not exists (select * from result1 where result1.PerId=data.PerId);


INSERT INTO result1 DEFAULT VALUES 																/* creates a new row using the defined default values */
INSERT INTO result1 (PerId, name, code, category) SELECT PerId, name, code, category FROM data 	/* Copies the entire data table*/


INSERT INTO result1 (PerId, name, code, category) SELECT PerId, name, code, category FROM data WHERE data.PerId = 100;	/* Copies the entire data table*/


CREATE TRIGGER method1_b1 UPDATE OF b1 ON results 
BEGIN 
	UPDATE results SET x1 = (CASE WHEN new.b1>1 THEN new.b1+0.01 WHEN new.b1=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
	UPDATE results SET res_01 = (x1 + x2 + x3 + x4 + x5 + x6 + x7 + x8 + x9 + x10 + x11 + x12 + x13 + x14 + x15 + x16 + x17 + x18 + x19 + x20 + x21 + x22 + x23 + x24 + x25 + x26 + x27 + x28 + x29 + x30) WHERE PerId=old.PerId; 
END;


CREATE TABLE "data"  ("PerId" integer NULL, "name" varchar(20) NULL, "category" varchar(1) NULL, "b1" integer NULL, "b2" integer NULL, "b3" integer NULL, "b4" integer NULL, "b5" integer NULL, "b6" integer NULL, "b7" integer NULL, "b8" integer NULL, "b9" integer NULL, "b10" integer NULL, "b11" integer NULL, "b12" integer NULL, "b13" integer NULL, "b14" integer NULL, "b15" integer NULL, "b16" integer NULL, "b17" integer NULL, "b18" integer NULL, "b19" integer NULL, "b20" integer NULL, "b21" integer NULL, "b22" integer NULL, "b23" integer NULL, "b24" integer NULL, "b25" integer NULL, "b26" integer NULL, "b27" integer NULL, "b28" integer NULL, "b29" integer NULL, "b30" integer NULL);



SELECT sum(CASE WHEN boulder1>1 THEN boulder1 ELSE 0 END) FROM results;

// To count the number of competitors who have completed a bloc (in this case boulder1):
	SELECT sum(CASE WHEN boulder1>1 THEN 1 ELSE 0 END) FROM results;
	

/* Basic Table Schema */
CREATE TABLE "results"  ("PerId" integer NULL, "name" varchar(20) NULL, "category" varchar(1) NULL, "b1" integer NULL, "b2" integer NULL, "b3" integer NULL, "b4" integer NULL, "b5" integer NULL, "b6" integer NULL, "b7" integer NULL, "b8" integer NULL, "b9" integer NULL, "b10" integer NULL, "b11" integer NULL, "b12" integer NULL, "b13" integer NULL, "b14" integer NULL, "b15" integer NULL, "b16" integer NULL, "b17" integer NULL, "b18" integer NULL, "b19" integer NULL, "b20" integer NULL, "b21" integer NULL, "b22" integer NULL, "b23" integer NULL, "b24" integer NULL, "b25" integer NULL, "b26" integer NULL, "b27" integer NULL, "b28" integer NULL, "b29" integer NULL, "b30" integer NULL, "x1" decimal(38.18) DEFAULT 0.0, "x2" decimal(38.18) DEFAULT 0.0, "x3" decimal(38.18) DEFAULT 0.0, "x4" decimal(38.18) DEFAULT 0.0, "x5" decimal(38.18) DEFAULT 0.0, "x6" decimal(38.18) DEFAULT 0.0, "x7" decimal(38.18) DEFAULT 0.0, "x8" decimal(38.18) DEFAULT 0.0, "x9" decimal(38.18) DEFAULT 0.0, "x10" decimal(38.18) DEFAULT 0.0, "x11" decimal(38.18) DEFAULT 0.0, "x12" decimal(38.18) DEFAULT 0.0, "x13" decimal(38.18) DEFAULT 0.0, "x14" decimal(38.18) DEFAULT 0.0, "x15" decimal(38.18) DEFAULT 0.0, "x16" decimal(38.18) DEFAULT 0.0, "x17" decimal(38.18) DEFAULT 0.0, "x18" decimal(38.18) DEFAULT 0.0, "x19" decimal(38.18) DEFAULT 0.0, "x20" decimal(38.18) DEFAULT 0.0, "x21" decimal(38.18) DEFAULT 0.0, "x22" decimal(38.18) DEFAULT 0.0, "x23" decimal(38.18) DEFAULT 0.0, "x24" decimal(38.18) DEFAULT 0.0, "x25" decimal(38.18) DEFAULT 0.0, "x26" decimal(38.18) DEFAULT 0.0, "x27" decimal(38.18) DEFAULT 0.0, "x28" decimal(38.18) DEFAULT 0.0, "x29" decimal(38.18) DEFAULT 0.0, "x30" decimal(38.18) DEFAULT 0.0, "res_01" decimal(38.18) NULL);

/* VIEWS */
CREATE VIEW male AS SELECT PerId, name, category, b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15, b16, b17, b18, b19, b20, b21, b22, b23, b24, b25, b26, b27, b28, b29, b30, res_01 FROM results WHERE results.category = 'M' OR results.category = 'm';
CREATE VIEW female AS SELECT PerId, name, category, b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15, b16, b17, b18, b19, b20, b21, b22, b23, b24, b25, b26, b27, b28, b29, b30, res_01 FROM results WHERE results.category = 'F' OR results.category = 'f';

/* 
 *
 *	Trigger to calculate points (Method 01) 
 *
 */

/* For a single cell */
CREATE TRIGGER method1_b1 UPDATE OF b1 ON results BEGIN UPDATE results SET x1 = (CASE WHEN new.b1>1 THEN new.b1+0.01 WHEN new.b1=1 THEN 0.01 ELSE 0 END) WHERE PerId = old.PerId; END;

/* For a single cell, and update the aggregate score */
CREATE TRIGGER method1_b1 UPDATE OF b1 ON results 
BEGIN 
	UPDATE results SET x1 = (CASE WHEN new.b1>1 THEN new.b1+0.01 WHEN new.b1=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
	UPDATE results SET res_01 = (x1 + x2 + x3 + x4 + x5 + x6 + x7 + x8 + x9 + x10 + x11 + x12 + x13 + x14 + x15 + x16 + x17 + x18 + x19 + x20 + x21 + x22 + x23 + x24 + x25 + x26 + x27 + x28 + x29 + x30) WHERE PerId=old.PerId; 
END;

/* For any result cell and update the aggregate score */
CREATE TRIGGER result_01 UPDATE OF b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15, b16, b17, b18, b19, b20, b21, b22, b23, b24, b25, b26, b27, b28, b29, b30 ON results BEGIN 
UPDATE results SET x1 = (CASE WHEN new.b1>1 THEN new.b1+0.01 WHEN new.b1=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x2 = (CASE WHEN new.b2>1 THEN new.b2+0.01 WHEN new.b2=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x3 = (CASE WHEN new.b3>1 THEN new.b3+0.01 WHEN new.b3=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x4 = (CASE WHEN new.b4>1 THEN new.b4+0.01 WHEN new.b4=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x5 = (CASE WHEN new.b5>1 THEN new.b5+0.01 WHEN new.b5=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x6 = (CASE WHEN new.b6>1 THEN new.b6+0.01 WHEN new.b6=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x7 = (CASE WHEN new.b7>1 THEN new.b7+0.01 WHEN new.b7=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x8 = (CASE WHEN new.b8>1 THEN new.b8+0.01 WHEN new.b8=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x9 = (CASE WHEN new.b9>1 THEN new.b9+0.01 WHEN new.b9=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x10 = (CASE WHEN new.b10>1 THEN new.b10+0.01 WHEN new.b10=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x11 = (CASE WHEN new.b11>1 THEN new.b11+0.01 WHEN new.b11=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x12 = (CASE WHEN new.b12>1 THEN new.b12+0.01 WHEN new.b12=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x13 = (CASE WHEN new.b13>1 THEN new.b13+0.01 WHEN new.b13=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x14 = (CASE WHEN new.b14>1 THEN new.b14+0.01 WHEN new.b14=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x15 = (CASE WHEN new.b15>1 THEN new.b15+0.01 WHEN new.b15=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x16 = (CASE WHEN new.b16>1 THEN new.b16+0.01 WHEN new.b16=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x17 = (CASE WHEN new.b17>1 THEN new.b17+0.01 WHEN new.b17=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x18 = (CASE WHEN new.b18>1 THEN new.b18+0.01 WHEN new.b18=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x19 = (CASE WHEN new.b19>1 THEN new.b19+0.01 WHEN new.b19=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x20 = (CASE WHEN new.b20>1 THEN new.b20+0.01 WHEN new.b20=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x21 = (CASE WHEN new.b21>1 THEN new.b21+0.01 WHEN new.b21=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x22 = (CASE WHEN new.b22>1 THEN new.b22+0.01 WHEN new.b22=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x23 = (CASE WHEN new.b23>1 THEN new.b23+0.01 WHEN new.b23=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x24 = (CASE WHEN new.b24>1 THEN new.b24+0.01 WHEN new.b24=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x25 = (CASE WHEN new.b25>1 THEN new.b25+0.01 WHEN new.b25=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x26 = (CASE WHEN new.b26>1 THEN new.b26+0.01 WHEN new.b26=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x27 = (CASE WHEN new.b27>1 THEN new.b27+0.01 WHEN new.b27=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x28 = (CASE WHEN new.b28>1 THEN new.b28+0.01 WHEN new.b28=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x29 = (CASE WHEN new.b29>1 THEN new.b29+0.01 WHEN new.b29=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET x30 = (CASE WHEN new.b30>1 THEN new.b30+0.01 WHEN new.b30=1 THEN 0.01 ELSE 0 END) WHERE PerId=old.PerId; 
UPDATE results SET res_01 = (x1 + x2 + x3 + x4 + x5 + x6 + x7 + x8 + x9 + x10 + x11 + x12 + x13 + x14 + x15 + x16 + x17 + x18 + x19 + x20 + x21 + x22 + x23 + x24 + x25 + x26 + x27 + x28 + x29 + x30) WHERE PerId=old.PerId; 
END;


/* 
 *
 *	Trigger to calculate points (Method 02) 
 *
 */


 /* For a single cell, and update the aggregate score */
CREATE TRIGGER test UPDATE OF b1 ON results 
BEGIN 
	UPDATE results SET y1 = (CASE WHEN new.b1 IS NULL THEN 0 WHEN new.b1<2 THEN 0 ELSE 900 END) WHERE PerId = old.PerId; 
	UPDATE results SET y1 = new.y1/(SELECT CAST(sum(CASE WHEN new.b1>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId; 
	UPDATE results SET res_02 = (y1 + y2 + y3 + y4 + y5 + y6 + y7 + y8 + y9 + y10 + y11 + y12 + y13 + y14 + y15 + y16 + y17 + y18 + y19 + y20 + y21 + y22 + y23 + y24 + y25 + y26 + y27 + y28 + y29 + y30) WHERE PerId=old.PerId; 
END;





CREATE TRIGGER test UPDATE OF b1 ON results BEGIN 
UPDATE results SET y1 = (CASE WHEN new.b1 IS NULL THEN 0 WHEN new.b1<2 THEN 0 ELSE 900 END) WHERE PerId = old.PerId; 
UPDATE results SET bon_02 = (SELECT sum(CASE WHEN b1>1 THEN 1 ELSE 0 END) FROM results) WHERE PerId=old.PerId; 
UPDATE results SET y1 = new.y1/new.bon_02 WHERE PerId = old.PerId; 
UPDATE results SET res_02 = (y1 + y2 + y3 + y4 + y5 + y6 + y7 + y8 + y9 + y10 + y11 + y12 + y13 + y14 + y15 + y16 + y17 + y18 + y19 + y20 + y21 + y22 + y23 + y24 + y25 + y26 + y27 + y28 + y29 + y30) WHERE PerId=old.PerId; END;



/* For any result cell and update the aggregate score */
CREATE TRIGGER result_02 
UPDATE OF b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15, b16, b17, b18, b19, b20, b21, b22, b23, b24, b25, b26, b27, b28, b29, b30 ON results 
BEGIN 
UPDATE results SET y1 = (CASE WHEN new.b1 IS NULL THEN 0 WHEN new.b1<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b1>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y2 = (CASE WHEN new.b2 IS NULL THEN 0 WHEN new.b2<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b2>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y3 = (CASE WHEN new.b3 IS NULL THEN 0 WHEN new.b3<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b3>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y4 = (CASE WHEN new.b4 IS NULL THEN 0 WHEN new.b4<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b4>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y5 = (CASE WHEN new.b5 IS NULL THEN 0 WHEN new.b5<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b5>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y6 = (CASE WHEN new.b6 IS NULL THEN 0 WHEN new.b6<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b6>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y7 = (CASE WHEN new.b7 IS NULL THEN 0 WHEN new.b7<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b7>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y8 = (CASE WHEN new.b8 IS NULL THEN 0 WHEN new.b8<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b8>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y9 = (CASE WHEN new.b9 IS NULL THEN 0 WHEN new.b9<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b9>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y10 = (CASE WHEN new.b10 IS NULL THEN 0 WHEN new.b10<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b10>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y11 = (CASE WHEN new.b11 IS NULL THEN 0 WHEN new.b11<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b11>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y12 = (CASE WHEN new.b12 IS NULL THEN 0 WHEN new.b12<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b12>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y13 = (CASE WHEN new.b13 IS NULL THEN 0 WHEN new.b13<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b13>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y14 = (CASE WHEN new.b14 IS NULL THEN 0 WHEN new.b14<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b14>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y15 = (CASE WHEN new.b15 IS NULL THEN 0 WHEN new.b15<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b15>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y16 = (CASE WHEN new.b16 IS NULL THEN 0 WHEN new.b16<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b16>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y17 = (CASE WHEN new.b17 IS NULL THEN 0 WHEN new.b17<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b17>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y18 = (CASE WHEN new.b18 IS NULL THEN 0 WHEN new.b18<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b18>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y19 = (CASE WHEN new.b19 IS NULL THEN 0 WHEN new.b19<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b19>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y20 = (CASE WHEN new.b20 IS NULL THEN 0 WHEN new.b20<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b20>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y21 = (CASE WHEN new.b21 IS NULL THEN 0 WHEN new.b21<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b21>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y22 = (CASE WHEN new.b22 IS NULL THEN 0 WHEN new.b22<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b22>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y23 = (CASE WHEN new.b23 IS NULL THEN 0 WHEN new.b23<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b23>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y24 = (CASE WHEN new.b24 IS NULL THEN 0 WHEN new.b24<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b24>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y25 = (CASE WHEN new.b25 IS NULL THEN 0 WHEN new.b25<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b25>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y26 = (CASE WHEN new.b26 IS NULL THEN 0 WHEN new.b26<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b26>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y27 = (CASE WHEN new.b27 IS NULL THEN 0 WHEN new.b27<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b27>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y28 = (CASE WHEN new.b28 IS NULL THEN 0 WHEN new.b28<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b28>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y29 = (CASE WHEN new.b29 IS NULL THEN 0 WHEN new.b29<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b29>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET y30 = (CASE WHEN new.b30 IS NULL THEN 0 WHEN new.b30<2 THEN 0 ELSE 900/(SELECT CAST(sum(CASE WHEN new.b30>1 THEN 1 ELSE 0 END) AS FLOAT) FROM results) END) WHERE PerId = old.PerId;
UPDATE results SET res_02 = (y1 + y2 + y3 + y4 + y5 + y6 + y7 + y8 + y9 + y10 + y11 + y12 + y13 + y14 + y15 + y16 + y17 + y18 + y19 + y20 + y21 + y22 + y23 + y24 + y25 + y26 + y27 + y28 + y29 + y30) WHERE PerId=old.PerId; 
END;







insert into results ("PerId", "name", "category") values (100, "Stohr", "F"); 
insert into results ("PerId", "name", "category") values (105, "LeNeve", "F"); 
insert into results ("PerId", "name", "category") values (205, "Wurm", "F");
