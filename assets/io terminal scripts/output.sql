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
LIMIT 0,50;