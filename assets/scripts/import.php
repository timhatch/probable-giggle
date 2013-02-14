<?php
	/* Configuration - Allowed filetype, size and upload location 		*/
	$allowed_filetypes = array('.csv','.txt');
	$max_filesize = 524288;

	/* If there is any existing startlist file, then delete - unlink() - it		*/
	$newfile = './startlist.csv' ; 
	uploadFromFile($newfile);
	
	/*!
	 *	Upload data from the input file
	!*/	
	function uploadFromFile($newfile){
		/* Open the temporary input file and read each line of data 	*/
		ini_set('auto_detect_line_endings', true); 
		$handle = fopen($newfile,'r');
		/* Open the database 											*/
		$db = new SQLite3('./results.db');
		 
		/*  Flush the database to avoid duplicated results */
		$db->exec("DELETE FROM data; DELETE FROM result1");
		
		/* Read the data from the buffer and insert into the database */	
		while (!feof($handle)) {
			$RW = explode( ',', fgets($handle, 1024));	// formatted as...
			$PerId 	= trim($RW[0]);						// PerId
			$name 	= trim($RW[1]);						// name			
			$cat 	= trim($RW[2]);						// category
			$code 	= trim($RW[3]);						// code	
			$theResult = $db->exec("INSERT INTO data (PerId, name, category, code) VALUES ('$PerId', '$name', '$cat', '$code')");	
		}
		/* Close the file and exit */
		fclose($handle);
		echo "Database entries modified successfully";
		exit;
	}
?>