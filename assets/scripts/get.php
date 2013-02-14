<?php
 	$PerId	= $_GET['PerId'];

	$db		= new SQLite3('results.db');

	$result = $db->query("select * from data where PerId = '$PerId'");
	$result = $result->fetchArray(SQLITE3_ASSOC);

	// Separate the identity & results data
	$identity = array_slice($result, 0, 4);
	$results = array_slice($result,4);

	// Package into a JSON object and return
	$RV = array("identity"=>$identity, "results"=>$results);
	echo json_encode($RV)."\n";
?>