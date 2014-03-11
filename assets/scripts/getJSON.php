<?php
	/*
	* Get results data for a category of climbers
	*/

	$cat = (isset($_GET['cat'])) ? $_GET['cat'] : 'f';

	$db		= new SQLite3('results.db');

	$reslt = $db->query("select * from result1 where category = '$cat'");

	// Echo each set of results data
	$result = array(); $i = 0;
	while($res = $reslt->fetchArray(SQLITE3_ASSOC)){
		$result[$i] = array("startnumber"=>$res['PerId'], "name"=>$res['name'], "countrycode"=>$res['code'], "category"=>$res['category'], "points"=>$res['comp1'], "bonus"=>$res['comp2']);
		$i++;
	}

	// Package into a JSON object and return
	echo json_encode($result);
?>