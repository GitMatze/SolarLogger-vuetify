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
        var endtime = config.endtime.month[moment().format("M")]
        if (hour>endtime) {
            return max_temp
        }
        else {            
            return Math.floor((max_temp-min_temp)/(endtime-starttime)*(hour-starttime)+min_temp)
        }
    }                
}

module.exports.controlWater = function(temp, grid, update_time, is_heating) {    
    var threshold = 1200 // critical excess power to switch heating on
    var target_temp = this.getTargetTemp()
    var suf_power = is_heating ? grid<0 : threshold+grid<0
    var t_diff = moment().diff(moment(update_time), 'seconds') // time since grid was last updated
    if (t_diff >30) {
        console.log('Grid power is not updated, turn heating of')
    }    
    var is_heating_new =  suf_power && temp<target_temp && t_diff<30
    
    return {
        target_temp: target_temp,
        threshold: threshold,
        is_heating: is_heating_new
    }
}

module.exports.getCurrentConfig = function() {
   current_month = moment().format("M")
    return {
        month: current_month, 
        min_temp: min_temp,
        max_temp: max_temp,
        starttime: starttime,
        endtime: config.endtime.month[current_month]
    }
}



