<?php
	/*
	* Output all results data as a CSV formatted stream
	*/

	// Echo the header information
	echo "PerId,Name,Code,Category,";
	for($i=1; $i<31; $i++) echo "b".$i.",";
	echo "Points,Bonuses";

	// Get the results data
	$db		= new SQLite3('results.db');
	$result = $db->query("select * from result1 where category='f' or category='fj'");

	// Echo each set of results data
	while($res = $result->fetchArray(SQLITE3_ASSOC)){
		echo "\n".$res['PerId'].",".$res['name'].",".$res['code'].",".$res['category'].",";
		for($i=1; $i<31; $i++) echo $res['b'.$i].",";
		echo $res['comp1'].",".$res['comp2'];
	}
?>
