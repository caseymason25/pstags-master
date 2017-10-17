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
    
   

    //Free the connection
    $conn = NULL;
    
    echo $lookback_timestamp;
} else {
    echo 0;
}
?>