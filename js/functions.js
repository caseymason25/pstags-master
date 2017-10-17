
/**
 *
 * @param {type} name
 * @param {type} aliases
 * @returns {Queue}
 */
var Queue = function(name, aliases) {
    this.Name = name; //"Surgery"
    this.Aliases = aliases; //["Surgery SWx", "Surgery AMS IR", "Surgery AMS Config"];
    this.AssociateList = [];

    this.AddAssociate = function (addAssociate) {
        this.AssociateList.push(new Associate(addAssociate));
        return true;
    };

    this.GetAssociate = function (getAssociate) {
        var _foundAssociate = false;
        for (x = 0; x < this.AssociateList.length; x++) {
            if (this.AssociateList[x].AssociateName === getAssociate) {
                _foundAssociate = this.AssociateList[x];
            }
        }
        return _foundAssociate;
    };
};

/**
 *
 * @param {type} associate
 * @returns {Associate}
 */
var Associate = function (associate) {
    this.AssociateName = "";
    // Score will start at 1
    this.Score = 1;
    this.ServiceRecordList = [];

    // oncreate, set the name
    this.AssociateName = associate;

    this.AddServiceRecord = function (addServiceRecord) {
        this.ServiceRecordList.push(new ServiceRecord(addServiceRecord));
    };

    this.GetServiceRecord = function (getServiceRecord) {
        var _foundServiceRecord = false;
        for (x = 0; x < this.ServiceRecordList.length; x++) {
            if (this.ServiceRecordList[x].Number === getServiceRecord) {
                _foundServiceRecord = this.ServiceRecordList[x];
            }
        }
        return _foundServiceRecord;
    };
};

/**
 *
 * @param {type} json
 * @returns {ServiceRecord}
 */
var ServiceRecord = function(json) {
    this.Number = 0;

    this.Number = json.sr_number;

    // This holds the json object. It will contain all the info from --
    // -- the row returned by the SQL
    this.AllInfo = json;
};


/**
 * This builds the Queue objects and populates them with the associates and SRs to keep track of
 * @param {type} json
 * @returns {BlobBuilder}
 */
function BlobBuilder(json) {
    this.Queues = [];

    // These are hardcoded for the Perioperative Team
    this.Queues.push(new Queue("Surgery", ["Surgery SWx", "Surgery AMS IR", "Surgery AMS Config"]));
    this.Queues.push(new Queue("Anesthesia", ["Anesthesia SWx", "Anesthesia AMS IR", "Anesthesia AMS Config"]));
    this.Queues.push(new Queue("Supply Chain", ["Supply Chain SWx", "Supply Chain AMS IR", "Supply Chain AMS Config"]));
    this.Queues.push(new Queue("Other", ["Placeholder for Other Queue"]));

    var _refreshTime = new Date();
    $("#last-refresh").html(_refreshTime);
    if(json.length === 0) {
      $("#db-snapshot").html("No data loaded for look-back range");
    }

    for (var i = 0; i < json.length; i++) {
        var _currentQueue;
        var _currentAssociate;

        if(i===0) {
            var _dbSnapShot = new Date(json[i].db_snapshot);
            $("#db-snapshot").html(_dbSnapShot);
            // If the dbSnapShot is 5 minutes or more out of date, make it red
            if(_refreshTime.getTime() >= _dbSnapShot.getTime() + 300000) {
                $("#db-snapshot").css("color", "#FF0000;");
            }
        }

        // We only care about freebies
        if (json[i].freebie === "1") {
            // this is a freebie, process it

            // see if we have found this solution yet, returns -1 if not found
            var inqueue;
            var _queueIndex = -1;

            // Add the solution to the proper queue
            for(var j = 0; j < this.Queues.length; j++) {
                inqueue = $.inArray(json[i].sr_team, this.Queues[j].Aliases);
                if(inqueue === -1) {
                    //do nothing
                } else {
                    _queueIndex = j;
                }
            }


            if (_queueIndex < 0) {
                // If not Surgery, Supply Chain, or Anesthesia set the index to add to the "Other" Queue.
                _queueIndex = 3; // index for 'Other'
                console.log("No queue found, adding to Other Queue: " + json[i].sr_team);
            }
            _currentQueue = this.Queues[_queueIndex];
            _currentAssociate = _currentQueue.GetAssociate(json[i].ta_owner);

            if (_currentAssociate) {
                // found the associate in this solution, increment score
                _currentAssociate.Score++;
                // Add the service record info
                _currentAssociate.AddServiceRecord(json[i]);
            } else {
                // didn't find the associate, add them
                _currentQueue.AddAssociate(json[i].ta_owner);
                // Get the newly added associate
                _currentAssociate = _currentQueue.GetAssociate(json[i].ta_owner);
                // Add the service record info
                _currentAssociate.AddServiceRecord(json[i]);
            }





        }
    }

    console.log("Queues: " + this.Queues);





    this.Render = function() {
        var _html = "";
        for (var i = 0; i < this.Queues.length; i++) {
            if(i === 3 && this.Queues[i].AssociateList.length === 0) {
                // Only show the 'Other' solution if there is an Associate List > 0
            } else {
                _html += '<div class="solution">';
                _html += '<h1>' + this.Queues[i].Name + '</h1>';
                _html += '<div class="scoreboard">';
                for(var j = 0; j < this.Queues[i].AssociateList.length; j++) {
                    _html += '<div class="associate">';
                    _html += '<span class="name">' + this.Queues[i].AssociateList[j].AssociateName + '</span>';
                    _html += '<span class="divider"> : </span>';
                    _html += '<span class="number">' + this.Queues[i].AssociateList[j].Score + '</span>';
                    _html += '</div>';
                    _html += '<div class="service-records"><ul>';
                    for(var k = 0; k < this.Queues[i].AssociateList[j].ServiceRecordList.length; k++) {
                        _html += '<li>' + this.Queues[i].AssociateList[j].ServiceRecordList[k].Number + '</li>';
                    }
                    _html += '</ul></div>';
                    _html += '<div class="clear"></div>';
                }
                _html += '</div>';
                _html += '</div>';
            }
        }

        $("#pstags-wrapper").html(_html);

        $(".associate").click(function (event) {
           event.preventDefault();
           $(this).next(".service-records").slideToggle("fast");
        });
    };
}

function RenderLookback(_dbsnapshot) {
    var _lookback = new Date(_dbsnapshot);
    $("#look-back").html(_lookback);
}

function ResetStats() {
    update("//_redacted_/PsTags/script/reset_stats.php",HandleReset); //live
}

function HandleReset(xhr) {
    if (xhr === "F") {
      console.log("fail in HandleReset");
        return 0;
    } else {
        console.log(xhr);
        console.log("Success in HandleReset");
        return 1;
    }
}

function PsTagsMain(json) {
    var _pstags = new BlobBuilder(json);
    _pstags.Render();
};
