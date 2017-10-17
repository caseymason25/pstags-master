/*--------------------------------------------------------------------------
|      This is used to output log files to the command line
+-------------------------------------------------------------------------*/
function DashCommon() {
    // init
};
DashCommon.prototype.log = function (msg, type) {

    var timestamp = this.currentTimeStamp();
    var logType = (typeof type != "undefined") ? type : 0;
    switch(type){
        case 1:
            typeStr = '['+'CNCTED'.green+'] ' +timestamp;
            break;
        case 2:
            typeStr = '['+'DISCNC'.red+'] ' +timestamp;
            break;
        case 3:
            typeStr = '['+'CMMAND'.yellow+'] ' +timestamp;
            break;
        default:
            typeStr = '['+'SERVER'.cyan+'] ' +timestamp;
            break;
    }
    console.log(typeStr+'    '+msg);
};

DashCommon.prototype.currentTimeStamp = function (){
    var now       = new Date();
    var monthsStr = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    var mnth      = monthsStr[now.getMonth()];
    var day       = ((now.getDate()<10) ? "0" : "")+ now.getDate();
    var yearjs    = now.getFullYear();
    var year      = (yearjs < 1000) ? yearjs + 1900 : yearjs;
    var hour      = ((now.getHours()<10) ? "0" : "")+ now.getHours();
    var minute    = ((now.getMinutes()<10) ? "0" : "")+ now.getMinutes();
    var second    = ((now.getSeconds()<10) ? "0" : "")+ now.getSeconds();
    return day+"-"+mnth+"-"+year+" "+hour+":"+minute+":"+second;
};

module.exports = DashCommon;
