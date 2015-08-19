<?php
	$PerId = $_POST['PerId'];
	$data	 = $_POST['models'];
	$data  = json_decode($data, true);	// Read as an associative array rather than an object
	
	// Open the database
	$db		= new SQLite3('results.db');
	
	$total = 0;
	$bonus = 0;
	
	foreach($data as $model){
		$ID = $model['id'];
		$ST = $model['state'];		
		$SC = ($ST != '3') ? $model['score'] : 'b';	

		// Insert the results
		$query = "UPDATE data SET '$ID' = '$ST' WHERE PerId = '$PerId'; UPDATE result1 SET '$ID' = '$SC' WHERE PerId = '$PerId';";
		$db->exec($query);
		
		// Increment the total score / number of bonuses
		$total += $model['score'];
		$bonus += $model['bonus'];
	}

	// Insert the total score / number of bonuses
	$db->exec("UPDATE result1 SET comp1='$total', comp2='$bonus' WHERE PerId = '$PerId';");
		
	// ALWAYS return a JSON Object
  echo (json_encode($data));
?>
