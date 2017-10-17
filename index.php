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
	<script src="js/external/jquery/jquery.js" type="text/javascript"></script>
        <script src="js/jquery-ui.min.js" type="text/javascript"></script>
        <script src="js/ajax.js" type="text/javascript"></script>
        <script src="js/functions.js" type="text/javascript"></script>
		
        <link rel="shortcut icon" href="favicon.ico" type="image/x-icon">
	<link rel="icon" href="favicon.ico" type="image/x-icon">

    </head>
    <body>
        <div id="lookback-info">
            <p title="This is when your browser last refreshed. Auto refresh every 2 minutes.">Last browser refresh: <span id="last-refresh"></span></p>
            <p title="This is when the database was last updated from navigator.">Database Snapshot Date: <span id="db-snapshot"></span></p>
            <p title="This is how far back in time we are looking. Configured on the admin panel.">Look-back Date: <span id="look-back"></span></p>
        </div>
        <div id="pstags-wrapper">
        </div>
        <div id="changelog"><a href="admin/" alt="admin panel"><span>Admin</span></a> | <a href="changelog/" alt="change log"><span>Change log</span></a></div>
        
        
        
    </body>
</html>
