/* ------------------------------------------------------------------------
|   PSTAGS = Open Incidents, Last Communication Outbound for Navigator
|   This module connects to the ODS Database, and queries for PSTAGS stats.
|   This will update the dashboard's DB with the ODS data
+-------------------------------------------------------------------------*/

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var fs              = require('fs');

function MSSQL_DBQ(DBC) {
  return function (sql, callback) {
    if (DBC.connecting) {
      DBC.once("connect", function () {
        var request = DBC.request();
        request.query(sql, callback);
      });
    } else {
      var request = DBC.request();
      request.query(sql, callback);
    }
  };
}

// Connect to ODS
var odsdb = new sql.Connection(config.ODS_NAV, function(err) {
  if (err) console.log(err);
});
var DBQ = MSSQL_DBQ(odsdb);

function PSTAGS () {
  EventEmitter.call(this); // Adds ability to emit events.
}
util.inherits(PSTAGS, EventEmitter);

PSTAGS.prototype.getNum = function () {
  var outer = this;

  var qry  = "  SELECT srd.sr_num as SR_NUMBER ";
  qry += " ,DATEADD(mi, DATEDIFF(mi, GETUTCDATE(), GETDATE()),  srd.Date_Opened_UTC) as SR_CREATED ";
  qry += " ,srd.date_updated as SR_UPDATED ";
  qry += " ,srd.status as SR_STATUS ";
  qry += " ,srd.team_name as SR_TEAM ";
  qry += " ,srd.solution_family as SR_SOLUTION_FAMILY ";
  qry += " ,srd.solution as SR_SOLUTION ";
  qry += " ,srd.solution_detail as SR_SOLUTION_DETAIL ";
  qry += " ,w.primary_owner as TA_OWNER ";
  qry += " ,w.status as TA_STATUS ";
  qry += " ,w.subtype as TA_SUBTYPE ";
  qry += " ,w.DATE_CREATED as TA_CREATED ";
  qry += " ,CASE WHEN w.subtype IN('Script Validation','CR Confirm') THEN 1 ELSE 0 END as FREEBIE ";
  qry += " ,GETDATE() as DB_SNAPSHOT ";
  qry += " FROM [ODSCRM].[dbo].[VW_SWX_SR_DETAIL] srd with (NOLOCK) ";
  qry += " , [ODSCRM].[dbo].[VW_SWX_ACTIVITY] w with (NOLOCK) ";
  qry += " WHERE srd.date_updated > GETDATE()-60 ";
  qry += " AND srd.team_name in ('Anesthesia SWx','Surgery SWx','Supply Chain SWx','Supply Chain AMS IR','Surgery AMS IR','Anesthesia AMS IR','Anesthesia AMS Config','Supply Chain AMS Config','Surgery AMS Config') ";
  qry += " AND w.sr_num = srd.sr_num ";
  qry += " AND w.type = 'Technical Advisor' ";
  qry += " ORDER BY TA_CREATED DESC; ";

  if (config.server.loglvl >= 5) {
    fs.writeFileSync("PSTAGS_QUERY_ODS.txt",qry);
  }
  if (config.server.loglvl >= 4) {
    comn.log("PSTAGS Query built, ready to run");
  }

  DBQ(qry, function (err, recordsets) {
    if (err) {
      if (config.server.loglvl >= 4) {
        comn.log("PSTAGS query error");
      }
      outer.emit('error', err);
      outer.emit('end');
      return;
    }
    if (typeof recordsets === "undefined" || recordsets === null || recordsets.length <= 0) {
      if (config.server.loglvl >= 4) {
        comn.log("PSTAGS query results undefined or <=0");
      }
      outer.emit('error', new Error("No Results from PSTAGS Query!"));
      outer.emit('end');
      return;
    }
    if (config.server.loglvl >= 3) {
      comn.log("PSTAGS results: "+recordsets.length);
    }
    outer.emit('incidents_retrieved',recordsets);
  });
  /*});*/
};
PSTAGS.prototype.build_insert = function (recordsets) {
  var outer = this;

  var rowsToRecord = [];

  rowsToRecord = [];
  var clean_txt = "";
  for (var i = 0; i < recordsets.length; i++) {

    var row = recordsets[i];

    // Add to insert statement for historical recordings
    var rowTxt  = "(";
    rowTxt += "'" + row.SR_NUMBER + "',";
    rowTxt += "'" + moment(row.SR_CREATED).format('YYYY-MM-DD HH:mm:ss') + "',";
    rowTxt += "'" + moment(row.SR_UPDATED).format('YYYY-MM-DD HH:mm:ss') + "',";
    rowTxt += "'" + row.SR_STATUS + "',";
	if(row.SR_SOLUTION_FAMILY) {
	clean_txt = row.SR_TEAM.replace(/[^\w\s]/gi, '');
    rowTxt += "'" + clean_txt+ "',";
	clean_txt = "";
	} else {
		rowTxt += "'',";
	}
	if(row.SR_SOLUTION_FAMILY) {
	clean_txt = row.SR_SOLUTION_FAMILY.replace(/[^\w\s]/gi, '');
    rowTxt += "'" + clean_txt+ "',";
	clean_txt = "";
	} else {
		rowTxt += "'',";
	}	
	if(row.SR_SOLUTION) {
	clean_txt = row.SR_SOLUTION.replace(/[^\w\s]/gi, '');
    rowTxt += "'" + clean_txt+ "',";
	clean_txt = "";
	} else {
		rowTxt += "'',";
	}
	if(row.SR_SOLUTION_DETAIL) {
	clean_txt = row.SR_SOLUTION_DETAIL.replace(/[^\w\s]/gi, '');
    rowTxt += "'" + clean_txt + "', ";
	clean_txt = "";
	} else {
		rowTxt += "'',";
	}
    rowTxt += "'" + row.TA_OWNER + "', ";
    rowTxt += "'" + row.TA_STATUS + "', ";
    rowTxt += "'" + row.TA_SUBTYPE + "', ";
    rowTxt += "'" + moment(row.TA_CREATED).format('YYYY-MM-DD HH:mm:ss') + "', ";
    rowTxt += "'" + row.FREEBIE + "', ";
    rowTxt += "'" + moment(row.DB_SNAPSHOT).format('YYYY-MM-DD HH:mm:ss') + "' ";
    rowTxt += ")";
    rowsToRecord.push(rowTxt);
  }

  if (config.server.loglvl >= 4) {
    comn.log("PSTAGS query results done with for loop");
  }

  outer.emit('insert_ready',rowsToRecord);
};
PSTAGS.prototype.makeQueryString = function (list, wrapVarWith, separateWith) {
  return list.map(function (assoc) {
    return wrapVarWith + assoc + wrapVarWith;
  }).join(separateWith);
};

PSTAGS.prototype.updateCurrentNumbers = function (rowsToRecord) {
  if (config.server.loglvl >= 3) {
    comn.log("PSTAGS Rows length - insert to local DB: "+rowsToRecord.length);
  }
  var outer = this;

  // Create INSERT for new Rows
  var INSERTSTATEMENT  = "INSERT INTO `tag` (";
  INSERTSTATEMENT += "`sr_number`,";
  INSERTSTATEMENT += "`sr_created`,";
  INSERTSTATEMENT += "`sr_updated`,";
  INSERTSTATEMENT += "`sr_status`,";
  INSERTSTATEMENT += "`sr_team`,";
  INSERTSTATEMENT += "`sr_solution_family`,";
  INSERTSTATEMENT += "`sr_solution`,";
  INSERTSTATEMENT += "`sr_solution_detail`,";
  INSERTSTATEMENT += "`ta_owner`,";
  INSERTSTATEMENT += "`ta_status`,";
  INSERTSTATEMENT += "`ta_subtype`,";
  INSERTSTATEMENT += "`ta_created`,";
  INSERTSTATEMENT += "`freebie`,";
  INSERTSTATEMENT += "`db_snapshot`";
  INSERTSTATEMENT += ") VALUES " + rowsToRecord.join(",") + ";";
  if (config.server.loglvl >= 5) {
    fs.writeFileSync("PSTAGS_QUERY_LOCAL.txt",INSERTSTATEMENT);
  }

  dashpool.getConnection(function (err, dashdb) {
    dashdb.beginTransaction(function (err) {
      if(err) {
        comn.log("Error getting connection to local DB");
        outer.emit('error', err);
      }
      dashdb.query(INSERTSTATEMENT, function (err, result) {
        if(err) {
          comn.log("PSTAGS Error running insert to local DB");
          outer.emit('error', err);
        }
        dashdb.commit(function (err) {
          if(err) {
            comn.log("PSTAGS error committing to local DB");
            outer.emit('error', err);
          }
          if (config.server.loglvl >= 3) {
            comn.log("PSTAGS Local DB Update complete");
          }
          dashdb.release(); // release connection back to pool.
          outer.emit('end');
        }); // END COMMIT
      }); // END INSERT
    }); // END TRANSACTION
  });
};
PSTAGS.prototype.purgeOldPSTAGS = function () {
  if (config.server.loglvl >= 4) {
    comn.log("PSTAGS purging old data");
  }
  var outer = this;

  // Create DELETE for old rows that need to be purged
  var DELETESTATEMENT  = "DELETE FROM `tag` WHERE DB_SNAPSHOT < now() - INTERVAL 1 MINUTE ;";

  dashpool.getConnection(function (err, dashdb) {
    if (err) {
      comn.log("Error with connection");
      outer.emit('error', err);
      return;
    }
    dashdb.beginTransaction(function (err) {
      if(err) {
        comn.log("Error with beginTransaction");
        outer.emit('error', err);
        return;
      }
      dashdb.query(DELETESTATEMENT, function (err, result) {
        if(err) {
          comn.log("Error with delete statement query");
          outer.emit('error', err);
        }
        if (config.server.loglvl >= 4) {
          comn.log("PSTAGS purging old data - ready to commit");
        }
        dashdb.commit(function(err) {
          if(err) {
            comn.log("Error with commit");
            outer.emit('error', err);
          }
          if (config.server.loglvl >= 4) {
            comn.log("PSTAGS purging old data - done");
          }
          dashdb.release(); // release connection back to pool.
          outer.emit('step_complete');
        }); // END COMMIT
      }); // END DELETE
    }); // END TRANSACTION
  });
};
module.exports = PSTAGS;
