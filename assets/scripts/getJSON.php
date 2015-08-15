<?php
  chdir("/users/timhatch/sites/flashresults/assets/scripts");

  // 
  // Get results data for a category of climbers
  // 
  $cat = (isset($_GET['cat'])) ? $_GET['cat'] : 'f';
    
  // Define the query string
  $query = "SELECT 
    t1.PerId AS PerId, 
    t1.name AS name , 
    t1.code AS code, 
    t1.comp1 AS comp1, 
    t1.comp2 AS comp2, 
    t1.category as category, 
    count() AS rank 
    FROM 
      (SELECT * from result1 where category = '$cat') t1, 
      (SELECT * from result1 where category = '$cat') t2 
    WHERE (t1.comp1 < t2.comp1)
      or (t1.comp1 = t2.comp1 and t1.comp2 < t2.comp2)
      or (t1.PerId = t2.PerId and t1.comp1 = t2.comp1) 
    group by t1.PerId
    order by rank asc";

  $db    = new SQLite3('results.db');
  $reslt = $db->query($query);

  // Echo each set of results data
  $result = array(); $i = 0;
  while($res = $reslt->fetchArray(SQLITE3_ASSOC)){
    $result[$i] = array(
      "id"=>$res['PerId'],
      "name"=>$res['name'],
      "countrycode"=>$res['code'],
      "category"=>$res['category'],
      "points"=>$res['comp1'],
      "bonus"=>$res['comp2'],
      "rank"=>$res['rank']);
    $i++;
  }

  // Package into a JSON object and return
  echo json_encode($result);
?>