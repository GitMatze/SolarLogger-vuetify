// This module actively retrieves and posts data (instead of passive api)
// is used for controlling the heating controller

const axios = require('axios')
const em = require('./energymanager')
const dm = require('./datamanager')
var CronJob = require('cron').CronJob;


url = "http://esp8266:80"

// gets temperature
const getTemp = function() {
    return new Promise(async (resolve, reject) => {           
        try{
            const res = await axios.get( `${url}/getTemp` )
            const data = res.data
            resolve(data)
        } catch(err) {
            reject(err)
        }
    })
}

// posts on/off command
const postCommand = function(command) {
    return new Promise(async (resolve, reject) => {           
        try{
            const res = await axios.post( `${url}/postCommand`, command )
            resolve(res.status)
        } catch(err) {
            reject(err)
        }
    })
}

const updateHeating = async function() {
    try {
        var data = await getTemp()

        temp = parseInt(data.temp)
        console.log(temp)
  
        let state = em.controlWater(temp)
        console.log(state) 
        dm.update('water_temp',temp)
        dm.update('is_heating', state['is_heating'])
        dm.update('target_temp', state['target_temp'])
        dm.update('threshold', state['threshold'])

        command = {heat_on: state['is_heating'] ? "y": "n"}    
        var status = await postCommand(command)
        console.log(status)
    }
    catch(err) {
        console.log(`Error in Update Heating: ${err.message}`)
    }
}

// gets temperature and posts command to heating controller
var heatjob = new CronJob('*/20 * * * * *',  function() {
    try {
        console.log("HEATJOB")
        updateHeating()
    }
    catch (err) { console.log(`Heatjob Error: ${err.message}`) }
  }, null, true);


if (url = "http://esp8266:80") {
    console.warn(`CAUTION: YOU ARE SENDING COMMANDS TO ${url}`)  
}
  
heatjob.start()
