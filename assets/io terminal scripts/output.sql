#
# Output to <filename>
#

.output <filename>

#
# Pull output for defined categories
#

SELECT *
FROM result1
WHERE
    category IS "m"
    OR category IS "mj"
#    category IS "f"
#    OR category IS "fj"
ORDER BY comp1 DESC, comp1 DESC
#LIMIT 0,50;

#
# Team Results
#
SELECT
    team                        AS "Team",
    sum(comp1)                  AS "Points",
    group_concat(data.name)     AS "Members"
FROM result1
JOIN data USING (PerId)
WHERE team IS NOT null
GROUP BY team
ORDER BY Points DESC;