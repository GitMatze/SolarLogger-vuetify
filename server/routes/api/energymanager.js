const moment = require('moment');
config = require("./config.json") 
const dm = require('./datamanager')


var min_temp = config.min_temp
var max_temp = config.max_temp
var starttime = config.starttime
var wattage = config.wattage


// console.log(config.endtime.month[moment().month()])


// linearly increase target temp from min_temp at starttime to max_temp at endtime
getTargetTemp = function(hour, endtime) {

    if (hour<starttime) {
        return min_temp
    } 
    else {
        if (hour>endtime) { 
            return max_temp
        }
        else {            
            return Math.floor((max_temp-min_temp)/(endtime-starttime)*(hour-starttime)+min_temp)
        }
    }                
}

getThreshold = function(hour, endtime, temp, target_temp, is_heating) {
    timeDiff = endtime-hour
    tempDiff = target_temp-temp
    // console.log(`timeDiff: ${timeDiff}`)
    // console.log(`tempDiff: ${tempDiff}`)

    // if endtime has passed but temp is significantly lower than target temp, reduce threshold
    if (timeDiff<=0 && tempDiff > config.lowerThreshold.tempDiff) {
        threshold = config.lowerThreshold.threshold      
    }
    else {
       threshold = config.threshold
    }
    // hysteresis: lower threshold when heating is on
    threshold = is_heating ? threshold-config.hysteresis : threshold
    return threshold
    
}

module.exports.controlWater = function(temp) {    
    
    var grid = dm.getCurrent('grid_power')
    var is_heating = dm.getCurrent('is_heating')
    var update_time = dm.getTime('grid_power')

    var hour = moment().hour()
    var endtime = config.endtime.month[moment().format("M")]
    var target_temp = getTargetTemp(hour, endtime)
    // critical excess power to switch heating on
    var threshold = getThreshold(hour, endtime, temp, target_temp, is_heating) 

    var excess = is_heating ? -grid+wattage : -grid 
    var suf_power = excess > threshold
    var t_diff = moment().diff(moment(update_time), 'seconds') // time since grid was last updated
    if (t_diff >30) {
        console.log('Grid power is not being updated, turn heating off')
    }
    
    // 
    var force_heating = dm.getCurrent('force_heating')
    if (force_heating && temp >= config.force_heating_temp) {
        dm.update('force_heating', false)
        force_heating = false
    }

    var is_heating_new =  force_heating || suf_power && temp<target_temp && t_diff<30
    
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
        endtime: config.endtime.month[current_month],
        lowerThreshold: config.lowerThreshold,
        force_heating_temp: config.force_heating_temp        
    }
}

