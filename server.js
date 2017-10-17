var express         = require('express');
config              = require('./config');     // SERVER CONFIGURATION PARAMS
var path            = require('path');
moment              = require('moment');
var app             = express();
var http            = require('http');
var colors          = require('colors');       // https://github.com/marak/colors.js/
var fs              = require('fs');
mysql               = require('mysql');        // https://github.com/felixge/node-mysql
sql                 = require('mssql');        // https://github.com/patriksimek/node-mssql
var schedule        = require('node-schedule');    // https://github.com/tejasmanohar/node-schedule/wiki/Cron-style-Scheduling
var cred            = require("./cis-cred");   //SERVER PASSWORDS

// Set MySQL Database Credentials
config.DB.user              = cred[config.server.mode].PSTAGS.UN;
config.DB.password          = cred[config.server.mode].PSTAGS.PASS;

// Set ODS Database Credentials (Nav)
config.ODS_NAV.user     = cred[config.server.mode].ODS.UN;
config.ODS_NAV.password = cred[config.server.mode].ODS.PASS;

// Connection pool to Dashboard database.
dashpool = mysql.createPool({
  connectionLimit: 10,
  host: config.DB.host,
  user: config.DB.user,
  password: config.DB.password,
  database: config.DB.database,
  multipleStatements: true
});

var Calculator      = require('./modules/calc');
var DashCommon      = require('./modules/dashCommon');


comn = new DashCommon();
comn.log("Server Started".green);

/*--------------------------------------------------------------------------
|      DEFINE GLOBAL VARIABLES
+-------------------------------------------------------------------------*/

snapshotDtTm              = null;
updateInProgress          = false;
updateStartDTTM           = new Date();
updateEndDTTM             = null;
updateSuccessful          = null;
updateLastDuration        = 0;
update_attempts           = 0;

snapshotDtTm = new Date();

calc = new Calculator();

calc.on('fastStatsUpdate', function () {
  if (config.server.loglvl >= 4) {
    comn.log("All updates complete, resetting FastStatsUpdate");
  }
  updateInProgress   = false;
  updateSuccessful   = true;
  updateEndDTTM      = new Date();
  updateLastDuration = updateEndDTTM.getTime() - updateStartDTTM.getTime();
  update_attempts = 0;
});
calc.on('fastStatsUpdateERR', function (err) {
  updateInProgress   = false;
  updateSuccessful   = false;
  updateEndDTTM      = new Date();
  updateLastDuration = updateEndDTTM.getTime() - updateStartDTTM.getTime();
  comn.log(err);
});

GLOBAL.calcInterval = schedule.scheduleJob("*/"+config.calc.FAST_interval+" * * * *", function () {
  if (!updateInProgress) {
    updateInProgress = true;
    updateStartDTTM  = new Date();
    updateEndDTTM    = null;
    updateSuccessful = null;
    calc.updateFastStats();
  } else {
    update_attempts = update_attempts +1;
    comn.log("Skip:".yellow + " Update already in progress..."+update_attempts);
    if(update_attempts >= 2) {
      if (config.server.mode === 'PROD') {
        calc.emailAdmins("Updating fast stats already in progress:"+update_attempts);
      }
	  updateInProgress   = false;
	updateSuccessful   = true;
	updateEndDTTM      = new Date();
	updateLastDuration = updateEndDTTM.getTime() - updateStartDTTM.getTime();
	update_attempts = 0;
    }
  }
});
