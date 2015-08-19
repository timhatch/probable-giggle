<?php
  chdir("/users/timhatch/sites/flashresults/assets/scripts");
  /*
  * Get results data for a single climber, specified by their PerId value
  */

  // Set the $PerId variable from a named argument provided by the browser 
  // (i.e. if $_GET exists), or the first command line argument
  $PerId = ($_GET) ? $_GET['PerId'] : $argv[1];

  // Open the results database & query the results data
  $db     = new SQLite3('results.db');
  $result = $db->query("select * from data where PerId = '$PerId'");
  $result = $result->fetchArray(SQLITE3_ASSOC);

  // Separate the identity & results data
  $identity = array_slice($result, 0, 4);
  $results  = array_slice($result,4);

  // Package into a JSON object and return
  $RV = array("identity"=>$identity, "results"=>$results);
  echo json_encode($RV)."\n";
?>
