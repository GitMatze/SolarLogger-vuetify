const moment = require('moment');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('db.db');


const names = [
    'pv_power', 'grid_power', 
    'pv_energy', 'grid_in_energy', 'grid_out_energy',    
    'water_temp', 'is_heating', 'target_temp', 'threshold'
 ]

current = {}
update_time= {}
update_status={}
var name
for (name of names) {
    current[name]=null
    update_time[name]=null
    update_status[name]=false
}

const sql_groups= {  
    month: '%Y %m', 
    day: '%Y %m %d',
    year: '%Y' }  // used for queries of aggregated data

intervals = {energy:10*60*1000,
            power: 2*1000,
            water_temp:10*60*1000,
            delete:24*60*60*1000}

setInterval( insertEnergy, intervals['energy'] )
setInterval( insertPower, intervals['power'] )
setInterval( deleteOldEntries, intervals['delete'] )
setInterval( insertWatertemp, intervals['water_temp'] )  

const getMinMax = function(table) { 
    return new Promise((resolve,reject) => {
        try {
            let query = `SELECT MIN(time) min, MAX(time) max FROM ${table}`
            db.all(query, 
            (err, rows) => {
                if (err) {
                    console.log('Error at getMinMax')
                    reject(err)
                }
                else if (rows) {
                    console.log('rows')
                    console.log(rows)
                    resolve(rows)
                } else {
                reject(new Error(`Unexpected database result, table: ${table}`))
                }
            })           
        } 
        catch(err) {
            reject(err)
        }
    })
}

module.exports.update = function(name, value) {
    current[name]=value
    update_time[name]=moment().format()
    update_status[name]=true
    console.log('update '+name+': '+value)    
}

module.exports.getCurrent = function(name) {
    return current[name]
}

module.exports.getTime = function(name) {
    return update_time[name]
}

module.exports.getPeriod = async function(name, start, end) { //TODO implement power
    
    if (name == 'power') {
        var t_min = await getMinMax('power')
        console.log(`TMIN: ${t_min}`)
    }
    return new Promise(async (resolve, reject)=> {
        
        try {
            let start_n = moment(start).subtract(intervals[name], 'ms').format()
            let end_n = moment(end).add(intervals[name], 'ms').format()

            let query = ""
            let modu = null

            switch (name) {
                case 'power':
                    console.log(`${start}, ${t_min[0].min}`)
                    const t_diff = timeDiff(start, t_min[0].min)                                        
                    // use energy database if start date is further back than start of power table
                    if ( t_diff > 0 ) {
                        modu = getFilterConstant(start, end, intervals['energy'], 250)
                        query = `SELECT 
                        (T1.pv-T2.pv)*CAST(3600 AS FLOAT)/((julianday(T1.time)-julianday(T2.time))*24*60*60)/1000 pv,
                        ((T1.grid_out-T2.grid_out)-(T1.grid_in-T2.grid_in))*CAST(3600 AS FLOAT)/((julianday(T1.time)-julianday(T2.time))*24*60*60)/1000 grid,
                        datetime(T1.time, 'localtime') time	
                        FROM energy T1
                            INNER JOIN energy T2
                            ON T1.id = T2.id+1
                        WHERE T1.time>datetime('${start_n}') AND T1.time<datetime('${end_n}') AND T1.id%${modu}=0
                        ORDER BY T1.id DESC`
                    } else {
                        console.log('using power db')
                        modu = getFilterConstant(start, end, intervals['power'], 250)
                        query = `SELECT pv,grid,datetime(time, "localtime") time 
                        FROM power 
                        WHERE time>datetime('${start}') AND time<datetime('${end}') AND id%${modu}=0 
                        ORDER BY 3`
                    }
                    break

                // every table with a single column 'data' can be accessed
                default:
                    modu = getFilterConstant(start, end, intervals[name], 250)
                    console.log(modu)
                    query = `SELECT data, datetime(time, "localtime") time 
                    FROM ${name} 
                    WHERE time>datetime('${start_n}') AND time<datetime('${end_n}') AND id%'${modu}'=0 
                    ORDER BY 2 DESC`
                    break
            }      
            console.log(query)

            db.all(
            query,
            (err, rows) => {
                if (err) {
                    console.log('Database Error at getPeriod')
                    reject(err);
                    }                    
                else if (rows.length == 0) {
                    reject(new Error('Empty database return')) 
                }else {                     
                    console.log(`Sending ${rows.length} values of ${name}`)
                    resolve(rows)
                }                
            })
        } catch(err) {
            reject(err)
        } 
    })
} 

module.exports.getEnergyStats= async function(type, start, end) {
    return new Promise((resolve, reject) => {
        try { 
            db.all(`SELECT STRFTIME($sql, datetime(time, 'localtime')) time, 
            MAX(pv)-MIN(pv) pv, 
            MAX(grid_in)-MIN(grid_in) grid_in, 
            MAX(grid_out)-MIN(grid_out) grid_out 
            FROM energy
            WHERE time>datetime($start) AND time<datetime($end) 
            GROUP BY STRFTIME($sql, datetime(time, 'localtime')) 
            ORDER BY 1
            LIMIT 12`,
            {
              $sql: sql_groups[type], 
              $start: start,
              $end: end,
            },
            (err, rows) => {
              if (err) {
                console.log(`SQL Error: ${err.message}`)
                reject([{}])
              }
              else if (rows.length > 0 ) { // TODO row = undefined not catched
                console.log(`Number of data entries: ${rows.length}`)
                resolve(rows);        
              } 
              else { 
                console.log('Request Failed')
                reject( [{}])
              }    
            })
        }
        catch {
            reject( [{}] )
        }
    })     
}

function getFilterConstant(start, end, interval, output_num) {
    var tdiff = timeDiff(start, end)
    console.log(`tdiff: ${tdiff}`)
    var n = Math.ceil(tdiff/(interval/1000*output_num)) 
    return n
}

function insertEnergy() {
if (update_status['grid_in_energy'] && update_status['pv_energy']) {
    var time = update_time['grid_in_energy'] < update_time['pv_energy'] ?  // select oldest time stamp
        update_time['grid_in_energy'] : update_time['pv_energy']
    db.run( 
    'INSERT INTO energy (pv, grid_in, grid_out, time) VALUES ($pv, $grid_in, $grid_out, datetime($time))',
    {
        $pv: current['pv_energy'],
        $grid_in: current['grid_in_energy'],
        $grid_out: current['grid_out_energy'],
        $time: time
    },
    (err) => {
        if(err) { console.log(`Error at insertEnergy(): ${err.message}`) }
        else { 
            console.log(`Insert Energy, pv: ${current['pv_energy']}, grid_out: ${current['grid_out_energy']}`)
            update_status['pv_energy'] = false
            update_status['grid_in_energy'] = false
        }
    })
    }
}

function insertPower() {  //TODO change
    if (update_status['grid_power'] && update_status['pv_power'] ) {
        var time = MinTimeString(update_time['grid_power'], update_time['pv_power'])  // select oldest time stamp                
        db.run( 
        'INSERT INTO power (pv, grid, time) VALUES ($pv, $grid, datetime($time))',
        {
            $pv: current['pv_power'],
            $grid: current['grid_power'],
            $time: time
        },
        (err) => {
            if(err) { console.log(`Error at insertPower(): ${err.message}`) }
            else { 
                console.log(`Insert Power, pv: ${current['pv_power']}, grid: ${current['grid_power']}`)
                update_status['pv_power'] = false
                update_status['grid_power'] = false
            }
        })
    }
}

function insertWatertemp() {
    if (update_status['water_temp']) {
        var time = update_time['water_temp']
        db.run( 
        'INSERT INTO water_temp (data, time) VALUES ($data, datetime($time))',
        {
            $data: current['water_temp'],
            $time: time
        },
        (err) => {
            if(err) { console.log(`Error at insertWatertemp(): ${err.message}`) }
            else { 
                console.log(`Insert Watertemp, temp: ${current['water_temp']}`)
                update_status['water_temp'] = false
            }
        })
    }
}

function deleteOldEntries() {
    var min_time = moment().subtract(3, 'days').startOf('day').format()
    db.run( 
        'DELETE FROM power WHERE time < datetime($min_time)',
        {
        $min_time: min_time      
        },
        (err) => {
            if(err) { console.log(`Error at deleteOldEntries(): ${err.message}`) }        
        })
}

// returns time difference in seconds
function timeDiff(start,end) { 
    return moment(end).diff( moment(start), 'seconds' )
}

function MinTimeString(str1,str2) {
    return str1 < str2 ? str1 : str2   
}

  module.exports.getMinMax = getMinMax
  module.exports.MinTimeString = MinTimeString

