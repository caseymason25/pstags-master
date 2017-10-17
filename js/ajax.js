$(document).ready(function () {
    load("//_redacted_/pstags/script/get_tags.php", HandleJson); //live
    load("//_redacted_/pstags/script/get_lookback.php", HandleLookback); //live
    RefreshStats(60); // start the timer for refreshing the stats
});


var jsonBlob;

/**
  * Calls the specified CCL script and passes the response text to the appropriate callback function
  * @param {string} url : The name of the CCL script
  * @param {function} callback : The function to be called with the response text
  */
function load(url, callback) {
    try {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = checkReady;
        xhr.open('GET', url, true);
        xhr.send();

        function checkReady() { //check to see if request is ready
            try {
                if (xhr.readyState === XMLHttpRequest.DONE) { // 4 = "loaded"
                    if (xhr.status === 200) { // 200 = OK
                        console.log(xhr);
                        callback(xhr.responseText);
                    }
                    else {
                        console.log("Error in xhr.status");
                        console.log(xhr.status);
                        callback("F");
                    }
                }
                console.log("readyState: ", xhr.readyState);
            } catch (err) {
                console.log("Error in CheckReady(): ", err);
            }
        }
    } catch (err) {
        console.log("Error in load()");
    }
}

/**
 * 
 * @param {type} url
 * @param {type} callback
 * @returns {undefined}
 */
function update(url, callback) {
    try {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = checkReady;
        xhr.open('GET', url, true);
        xhr.send();

        function checkReady() { //check to see if request is ready
            try {
                if (xhr.readyState === XMLHttpRequest.DONE) { // 4 = "loaded"
                    if (xhr.status === 200) { // 200 = OK
                        //console.log(xhr);
                        callback(xhr.responseText);
                    }
                    else {
                        console.log("Error in xhr.status");
                        console.log(xhr.status);
                        callback("F");
                    }
                }
                //console.log("readyState: ", xhr.readyState);
            } catch (err) {
                console.log("Error in CheckReady(): " + err);
            }
        }
    } catch (err) {
        console.log("Error in load()"  + err);
    }
}

/**
 * 
 * @param {type} xhr
 * @returns {Number}
 */
function HandleJson(xhr) {
    if (xhr === "F") {
      console.log("fail in HandleJson");
        return 0;
    } else {
        //console.log(xhr);
        jsonBlob = JSON.parse(xhr);
        PsTagsMain(jsonBlob);
        //console.log("jsonblob: ");
        //console.log(jsonBlob);
        return 1;
    }
}

/**
 * 
 * @param {type} xhr
 * @returns {Number}
 */
function HandleLookback(xhr) {
    if (xhr === "F") {
      console.log("fail in HandleLookback");
        return 0;
    } else {
        RenderLookback(xhr);
        return 1;
    }
}



/**
 * Refreshes the data after the specified time
 * @param {int} seconds - the time in seconds between refreshes
 * @returns {undefined}
 */
function RefreshStats(seconds) {
    setTimeout(function(){
        load("//_redacted_/pstags/script/get_tags.php", HandleJson); //live
        load("//_redacted_/pstags/script/get_lookback.php", HandleLookback); //live
        RefreshStats(60);
    },(seconds * 1000));
}
