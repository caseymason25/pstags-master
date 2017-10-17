<!DOCTYPE html>
<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/PsTags/script/Database.php';

$conn = DatabaseConnect();

?>
<html>
    <head>
        <meta charset="UTF-8">
        <title>Tags Dashboard</title>
        <link rel="stylesheet" type="text/css" href="/PSTags/css/pstags.css">
        <link rel="stylesheet" type="text/css" href="/PSTags/js/jquery-ui.min.css">
        
        
	<script src="../js/external/jquery/jquery.js" type="text/javascript"></script>
        <script src="../js/jquery-ui.min.js" type="text/javascript"></script>
        <script src="../js/ajax.js" type="text/javascript"></script>
        <script src="../js/functions.js" type="text/javascript"></script>
		
        <link rel="shortcut icon" href="../favicon.ico" type="image/x-icon">
	<link rel="icon" href="../favicon.ico" type="image/x-icon">
                
                <script>
  $( function() {
    $( "#datepicker" ).datepicker();
    $.datepicker.setDefaults({
        dateFormat: "yy-mm-dd"
    });
  } );
  </script>
    </head>
    <body>

        <div id="pstags-reset">
            <h1>Admin Panel</h1>
            <p>This affects the entire dashboard, not just you</p>
            <p>Current Lookback Date/Time: <?php require_once $_SERVER['DOCUMENT_ROOT'] . "/PsTags/script/get_lookback.php" ?></p>
            <form action="/PsTags/script/reset_stats.php"  method="post" class="pstags-reset-form">
            <p>Date: <input type="text" id="datepicker" size="30" name="date_picker" /></p>
            <input type="submit" class="pstags-reset-button" name="submit_button" value="Reset Stats" />
            </form>
        </div>
        
        
    </body>
</html>
