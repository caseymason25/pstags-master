var EventEmitter  = require('events').EventEmitter;         // http://nodejs.org/api/events.html
var util          = require('util');                        // http://nodejs.org/api/util.html
var mysql         = require('mysql');                       // https://github.com/felixge/node-mysql
var nodemailer    = require('nodemailer');                  // https://github.com/nodemailer/nodemailer
var smtpTransport = require('nodemailer-smtp-transport');

// DashNode Modules //
var Timer = require('./timer');

// Number Modules //
var PSTAGSF = require('./PSTAGS');

function Calc() {
  EventEmitter.call(this);    // Adds capability to emit events.
}

util.inherits(Calc, EventEmitter);


Calc.prototype.emailAdmins =function(message) {
  comn.log(message);

  if ( config.server.mode == "PROD") {
    var transport = nodemailer.createTransport(smtpTransport({
      host: "smtprr.cerner.com",  // hostname
      secure: false,              // no need to use SSL
      secureConnection: false,
      port: 25,                   // port for secure SMTP
      tls: {
        rejectUnauthorized: false
      }
    }));

    var mailOptions = {
      to:      config.adminEmails,
      from:    "pstags@cis.cerner.com",
      subject: "PS Tags Error!",
      html:    "<span style='font-family:Helvetica,sans-serif; color:#6A737B;'>" + message + "</span>"
    };
    transport.sendMail(mailOptions, function(err, response){
      if (err) {
        comn.log(err); // Sending failed
      } else {
        comn.log("Sent email to ADMINS reporting issue.");
      }
    });
  }
}

Calc.prototype.updateFastStats = function (cb) {
  try {
    var outer = this;
    this.updateNumbers(function (err, data) {
      if(err) {
        comn.log(err);
        outer.emit('fastStatsUpdateERR', err);
        if (config.server.mode === 'PROD') {
          outer.emailAdmins("Error updating fast stats");
        }
        if(typeof cb !== 'undefined') cb(err);
      } else {
        outer.emit('fastStatsUpdate');
        if(typeof cb !== 'undefined') cb();
      }
    });
  } catch(err) {
    comn.log(err);
  }
};

Calc.prototype.updateNumbers = function (cb) {

  var outer = this;
  var timer = new Timer();
  if (config.server.loglvl >= 2) {
    //timer log
    comn.log('Refreshing PSTAGS');
  }

  /*--------------------------------------------------------------------------
  |    PS NAV TAGS
  +-------------------------------------------------------------------------*/
  if (config.calc.PSTAGS_enabled) {
    timer.newSubTimer('PSTAGS');
    var PSTAGS = new PSTAGSF();

    PSTAGS.query = [];
    PSTAGS.getNum(); //kick off the retrieval from ODS
    if (config.server.loglvl >= 3) {
      comn.log('PSTAGS starting');
    }
    PSTAGS.on('incidents_retrieved',function(recordsets) {
      if (config.server.loglvl >= 4) {
        comn.log("PSTAGS incidents_retrieved");
      }
      PSTAGS.build_insert(recordsets);
    });
    PSTAGS.on('insert_ready',function(query) {
      if (config.server.loglvl >= 4) {
        comn.log("PSTAGS Insert Built, Purging old data.");
      }
      PSTAGS.query = query;
      PSTAGS.purgeOldPSTAGS();
    });
    PSTAGS.on('step_complete',function() {
      if (config.server.loglvl >= 3) {
        comn.log("PSTAGS purge complete. Ready to insert new data");
      }
      PSTAGS.updateCurrentNumbers(PSTAGS.query);
    });
    PSTAGS.on('end', function () {
      cb(null);
      timer.log('PSTAGS has completed', 'PSTAGS');
    });
    PSTAGS.on('error', function (err) {
      timer.log('PSTAGS has completed, but with errors', 'PSTAGS');
      cb(err);
    });
  }
};

module.exports = Calc;
