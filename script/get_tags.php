<?php
//Require the database connect script (returns $conn if successful)
require_once $_SERVER['DOCUMENT_ROOT'] . '/PsTags/script/Database.php';

$conn = DatabaseConnect();
// The array that will contain JSON data to send back to the caller
$return_arr = array();
$lookback_timestamp;
// Needs connection to the database

if($conn)
{
    $lookbackquery = "SELECT lookback_date FROM lookback ORDER BY lookback_id DESC LIMIT 1";
    $lookbackresult = $conn->prepare($lookbackquery);
    $lookbackresult->execute();
    while ($row = $lookbackresult->fetch(PDO::FETCH_ASSOC)) {
        $lookback_timestamp = $row['lookback_date'];
    }
    
    $query = "SELECT * "
            . "FROM tag WHERE freebie=1 and ta_created >= :lookback "
            . "ORDER BY sr_solution_family,sr_solution,ta_owner ASC";
    
    $result = $conn->prepare($query);
    $result->bindValue(':lookback', $lookback_timestamp);
    $result->execute();
    
   

     while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
        $row_array = $row;
        array_push($return_arr,$row_array);
    }

    //Free the connection
    $conn = NULL;
    
    echo json_encode($return_arr);
} else {
    echo 0;
}

?>