<?php
	chdir("/users/timhatch/sites/flashresults/assets/scripts");

	/*
	* Get results data for a category of climbers
	*/

	$cat = (isset($_GET['cat'])) ? $_GET['cat'] : 'f';
    $catj = $cat.'j';
    
	$db    = new SQLite3('results.db');
	$reslt = $db->query("SELECT * FROM result1 WHERE category = '$cat' OR category = '$catj'");

	// Echo each set of results data
	$result = array(); $i = 0;
	while($res = $reslt->fetchArray(SQLITE3_ASSOC)){
		$result[$i] = array("startnumber"=>$res['PerId'],
            "name"=>$res['name'],
            "countrycode"=>$res['code'],
            "category"=>$res['category'],
            "points"=>$res['comp1'],
            "bonus"=>$res['comp2']);
		$i++;
	}

	// Package into a JSON object and return
	echo json_encode($result);
?>
