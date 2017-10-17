/*--------------------------------------------------------------------------
|    Timer functionality for Performance Testing
+-------------------------------------------------------------------------*/
var Timer = function(maxSize) {
    this.timers = [];
    this.newSubTimer('SYS');

    if (typeof maxSize !== "undefined") {
        this.maxSize = maxSize;
    } else {
        this.maxSize = 20;
    }
};
Timer.prototype.newSubTimer = function (name) {
    var newTimer = {
        id: name,
        start: process.hrtime()
    };
    this.timers.push(newTimer);
};
Timer.prototype.formatTimer = function (timer) {
    var fmt = "";
    var extraSpace = 0;

    if (timer.length >= this.maxSize) {
        fmt += timer.substring(0, this.maxSize);
    } else {
        fmt += timer;
        extraSpace = this.maxSize - timer.length;
    }

    var space = "";
    for (var i = 0; i < extraSpace; i++) {
        space += " ";
    }

    return '['+ fmt +']' + space;
};
Timer.prototype.log = function (note, subtimer) {
    var timer = subtimer || 'SYS';
    var precision = 5;

    for (var i in this.timers) {
        if (this.timers[i].id === timer) {
            // divide by a million to get nano to milli
            var elapsed = process.hrtime(this.timers[i].start)[1] / 1000000;
            // print message + time
            if (config.server.loglvl >= 2) {
                console.log(this.formatTimer(timer) +' ' + process.hrtime(this.timers[i].start)[0] + 's, '
                + elapsed.toFixed(precision) + 'ms - ' + note);
            }

            // Reset Timer
            this.timers[i].start = process.hrtime();
        }
    }
};

module.exports = Timer;
