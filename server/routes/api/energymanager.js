const moment = require('moment');
config = require("./config.json") 

var min_temp = config.min_temp
var max_temp = config.max_temp
var starttime = config.starttime

// console.log(config.endtime.month[moment().month()])


// linearly increase target temp from min_temp at starttime to max_temp at endtime
module.exports.getTargetTemp = function() {
    var hour = moment().hour()

    if (hour<starttime) {
        return min_temp
    } 
    else {
        var endtime = config.endtime.month[moment().month()]
        if (hour>endtime) {
            return max_temp
        }
        else {            
            return Math.floor((max_temp-min_temp)/(endtime-starttime)*(hour-starttime)+min_temp)
        }
    }                
}

