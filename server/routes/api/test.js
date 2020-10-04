const axios = require('axios')
const em = require('./energymanager')
const dm = require('./datamanager')



const getTemp = function() {
    return new Promise(async (resolve, reject) => {           
        try{
            const res = await axios.get( 'http://esp8266:80/getTemp' )
            const data = res.data
            resolve(data)
        } catch(err) {
            reject(err)
        }
    })
}

const postCommand = function(command) {
    return new Promise(async (resolve, reject) => {           
        try{
            const res = await axios.post( 'http://esp8266:80/postCommand', command )
            resolve(res.status)
        } catch(err) {
            reject(err)
        }
    })
}

const runPromise = function(num) {
    return new Promise((resolve, reject)=> {
        if (num>5) {
            resolve('Nummer größer fünf')
        }
        else {
            reject(new Error('kleiner als fünf'))
        }
    })
}

const handlePromise = function(){
    runPromise(3).then((result)=> {
        console.log('Result: ')
        console.log(result)
    }).catch((err)=> {
        console.log(err)
    })     
}

const handlePromise2 = async function() {
    try {
        result = await runPromise(7)
        console.log('result:')
        console.log(result)
    } catch (err) {
        console.log('Error detected')
        console.log(err)
    }

    
    
}
//handlePromise2()

const makeRequest = async function() {
    console.log("BF getTemp")
    var data = await getTemp()
    console.log("A getTemp")
    console.log(data.temp)
}

const makePost = async function() {
    console.log("BF Post")
    var status = await postCommand()
    console.log("A Post")
    console.log(status)
}

const makeBoth = async function() {
    console.log("BF getTemp")
    var data = await getTemp()
    console.log("A getTemp")

    temp = data.temp
    console.log(temp)
  
    let state = em.controlWater(temp)
    console.log(state) 
    dm.update('water_temp',temp)
    dm.update('is_heating', state['is_heating'])
    dm.update('target_temp', state['target_temp'])
    dm.update('threshold', state['threshold'])

    command = {heat_on: state['is_heating'] ? "y": "n"}    
    console.log("BF Post")
    var status = await postCommand(command)
    console.log("A Post")
    console.log(status)
}

var CronJob = require('cron').CronJob;

var job_daily = new CronJob('*/15 * * * * *',  function() {
    try {
      makeBoth()
    }
    catch (err) { console.log(`Daily Client Connction Error: ${err.message}`) }
  }, null, true);

