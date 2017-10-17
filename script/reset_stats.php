<?php
//Require the database connect script (returns $conn if successful)
require_once $_SERVER['DOCUMENT_ROOT'] . '/PsTags/script/Database.php';

function sanitize($dirty) {
    $safe = strip_tags($dirty);
    return $safe;
}

$conn = DatabaseConnect();
// The array that will contain JSON data to send back to the caller
$return_arr = array();

$lookback_timestamp = 0;
if(isset($_POST['date_picker'])) {
    $lookback_timestamp = sanitize($_POST['date_picker']) . " 00:00:00";
}

echo $lookback_timestamp;
// Needs connection to the database

if($conn)
{
    try{
        if($lookback_timestamp !== 0) {
    $query = "UPDATE ps_tag_dashboard.lookback SET lookback.lookback_date = :lookback WHERE lookback.lookback_id = 1";
    $result = $conn->prepare($query);
    $result->bindValue(':lookback', $lookback_timestamp);
    $result->execute();
        }

    //Free the connection
    $conn = NULL;
    echo 1;

    } catch(Exception $e) {
    
    echo $e;
    }
} else {
    echo 0;
}

?>