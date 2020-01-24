const express = require('express');
const sqlite3 = require('sqlite3');
const moment = require('moment');

const db = new sqlite3.Database('db.db');
const router = express.Router();

var t_max = {energy: null, power: null} //stores min and max time of entries in database
var t_min = {energy: null, power: null}

var current_power = {pv: null, grid: 1}
var current_energy = {pv: null, grid_in: 1, grid_out: 1}

var grid_update_status = {time: null, pow_new: false, en_new: false}
var pv_update_status = {time: null, pow_new: false, en_new: false}

const sql_groups= {
  month: '%Y %m', 
  day: '%Y %m %d',
  year: '%Y' }  // used for queries of aggregated data

updateMinMaxTime() //load on startup

setInterval(insertEnergy, 10*60*1000)
setInterval(insertPower, 2*1000)
setInterval(deleteOldEntries, 10*60*1000)

router.get('/MinMaxTime', (req, res) => {
  updateMinMaxTime()  //TODO energy is redundant 
  try {
    db.all(`SELECT MIN(time) min, MAX(time) max FROM energy`,
    (err, rows) => {
      if (rows[0].max != undefined) {
        //console.log(rows.length)
        res.send(rows);        
      } 
      else { 
        res.send( [{}])
      }    
    })
  }
  catch {
    res.send( [{}] )
  }
})

router.get('/current', (req, res) => {
  // console.log(`Sending current values, pv :${current_power.pv}, grid :${current_power.grid}`)
  var time = grid_update_status.time < pv_update_status.time ?  // select oldest time stamp
      grid_update_status.time : pv_update_status.time 
  res.send( [{power: current_power, energy: current_energy, time: time}] )        
})


router.get('/power/:period', (req, res) => {
  const periods = req.params.period.split('_');
  console.log('') 
  console.log(`Starttime: ${periods[0]}`)
  console.log(`Endtime: ${periods[1]}`)
  
  var t_diff = timeDiff(periods[0], t_min['power']) 
  console.log(`Time Difference to PowerMin:  ${t_diff}s, ${t_diff/4}*4s, ${t_diff/60}min`)
  
  // if requested start date is further back than the start of the power database,
  // use energy database
  if ( t_diff > 0 ) {
    modu = getFilterConstant(periods[0], periods[1], 10*60, 250)     
    console.log(`Using Energy DB, modu: ${modu}`)
    periods[0] = moment(periods[0]).subtract(10, 'minutes').format()
    periods[1] = moment(periods[1]).add(10, 'minutes').format()       

    db.all(
      `SELECT pv,grid_in, grid_out, datetime(time, "localtime") time 
      FROM energy 
      WHERE time>datetime($start) AND time<datetime($end) AND id%$mod=0 
      ORDER BY 4 DESC`,
      {
        $start: periods[0],
        $end: periods[1],
        $mod: modu
      },
      (err, rows) => {
        if (err) {
          console.log(`Database fetch not successfull, Error: ${err.message}`)
          res.send([{}]);
        }
        if (rows.length == 0) {
          console.log(`Empty databasa return`)
          res.send([{}]);
        }
        else {
          try {
            power = energyToPower(rows, 10*60)
            console.log(`Length of sent data ${power.length}`)
            res.send(power);
          }
          catch (e){
            res.send([{}]);
            console.log(`Power Conversion failed, Error: ${e.message}`)
          }
        } 
      })
  }
  // else use power database
  else {
    console.log('Using Power DB')
    modu = getFilterConstant(periods[0], periods[1], 4, 250) 
    
    db.all(
      `SELECT pv,grid,datetime(time, "localtime") time 
      FROM power 
      WHERE time>datetime($start) AND time<datetime($end) AND id%$mod=0 
      ORDER BY 3`,
        {
        $start: periods[0],
        $end: periods[1],
        $mod: modu
      },
      (err, rows) => {          
        if (err || rows.length == 0) {
          res.send([{}]); 
        } else {
          console.log(`Sending ${rows.length} Time Points`)
          res.send(rows)
        }
      })
  }
})

router.get('/energy/:data', (req, res) => {
  const data = req.params.data.split('_')
  const type = data[0]
  const period = [ data[1], data[2] ]
  console.log('')
  console.log('GET REQUEST energy/month')
  console.log(data)
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
      $sql: sql_groups[type], // TODO data is a bad name
      $start: period[0],
      $end: period[1],
    },
    (err, rows) => {
      if (err) {
        console.log(`SQL Error: ${err.message}`)
        res.send([{}])
      }
      else if (rows.length > 0 ) { // TODO row = undefined not catched
        console.log(`Number of data entries: ${rows.length}`)
        res.send(rows);        
      } 
      else { 
        console.log('Request Failed')
        res.send( [{}])
      }    
    })
  }
  catch {
    res.send( [{}] )
  }
})

/* router.post('/power', async (req, res) => { // TODO catch undefineds...
  db.run( 
    'INSERT INTO power (pv, grid, time) VALUES ($pv, $grid, datetime($time))',
    {
      $pv: req.body.pv,
      $grid: req.body.grid,
      $time: moment().format()
    },
    (err) => {
        if(err) { console.log(err.message) }
        else { 
          console.log(`Added new Value to power: pv: ${req.body.pv}, grid : ${req.body.grid}`)
          current_power.pv = req.body.pv
          current_power.grid = req.body.grid
          current_power.time = moment().format()
        }
    })
  res.status(201).send();
});

router.post('/energy', async (req, res) => { // TODO catch undefineds...
  db.run( 
    'INSERT INTO energy (pv, grid_in, grid_out, time) VALUES ($pv, $grid_in, $grid_out, datetime($time))',
    {
      $pv: req.body.pv,
      $grid_in: req.body.grid_in,
      $grid_out: req.body.grid_out,
      $time: moment().format()
    },
    (err) => {
        if(err) { console.log(err.message) }
        else { 
          console.log(`Added new Value to power: pv: ${req.body.pv}, grid : ${req.body.grid}`)
          current_power.pv = req.body.pv
          current_power.grid = req.body.grid
          current_power.time = moment().format()
        }
    })
  res.status(201).send();
}); */

router.post('/pv', async (req, res) => { 
  current_power.pv = req.body.power
  current_energy.pv = req.body.energy
  pv_update_status.pow_new = true
  pv_update_status.en_new = true
  pv_update_status.time = moment().format()
  console.log(`New pv energy value: ${req.body.power}`) 
  res.status(201).send();
});

router.post('/grid', async (req, res) => { 
  current_power.grid = req.body.power
  current_energy.grid_in = req.body.energy_in
  current_energy.grid_out = req.body.energy_out
  grid_update_status.pow_new = true
  grid_update_status.en_new = true
  grid_update_status.time = moment().format()
  console.log(`New grid power value: ${req.body.power}`) 
  res.status(201).send();
});

// Handle SPA
router.get('/download', (req, res) => {  
  res.download("C:/Users/Matthias/Documents/GitHub/SolarLogger-vuetify/db.db", 'database.db')
}); 


function insertEnergy() {
  if (grid_update_status.en_new && pv_update_status.en_new) {
    var time = grid_update_status.time < pv_update_status.time ?  // select oldest time stamp
              grid_update_status.time : pv_update_status.time
    db.run( 
      'INSERT INTO energy (pv, grid_in, grid_out, time) VALUES ($pv, $grid_in, $grid_out, datetime($time))',
      {
        $pv: current_energy.pv,
        $grid_in: current_energy.grid_in,
        $grid_out: current_energy.grid_out,
        $time: time
      },
      (err) => {
          if(err) { console.log(`Error at insertPower(): ${err.message}`) }
          else { 
            console.log(`Insert Power, pv: ${current_energy.pv}, grid_out: ${current_energy.grid_out}`)
            pv_update_status.en_new = false
            grid_update_status.en_new = false
          }
      })
    }
}

function insertPower() {
  if (grid_update_status.pow_new && pv_update_status.pow_new) {
    var time = grid_update_status.time < pv_update_status.time ?  // select oldest time stamp
              grid_update_status.time : pv_update_status.time
    db.run( 
      'INSERT INTO power (pv, grid, time) VALUES ($pv, $grid, datetime($time))',
      {
        $pv: current_power.pv,
        $grid: current_power.grid,
        $time: time
      },
      (err) => {
          if(err) { console.log(`Error at insertPower(): ${err.message}`) }
          else { 
            console.log(`Insert Power, pv: ${current_power.pv}, grid: ${current_power.grid}`)
            pv_update_status.pow_new = false
            grid_update_status.pow_new = false
          }
      })
    }
}

function deleteOldEntries() {
  var min_time = moment().subtract(2, 'days').format()
  db.run( 
    'DELETE FROM power WHERE time < datetime($min_time)',
    {
      $min_time: min_time      
    },
    (err) => {
        if(err) { console.log(`Error at deleteOldEntries(): ${err.message}`) }        
    })


}

// adding id%n=0 to the database query constraints will ensure
// that number of outputs is around output_num
function getFilterConstant(start, end, interval, output_num) {
  var tdiff = timeDiff(start, end)
  console.log(`tdiff: ${tdiff}`)
  var n = Math.ceil(tdiff/(interval*output_num)) 
  return n
}

function energyToPower(energy){
  var power = energy.map( function(entry, i, energy) {

    if (i<energy.length-1) {
      
      return {
        pv:   ( energy[i+1].pv - entry.pv ) / ( timeDiff(entry.time, energy[i+1].time) / 3600 ),
        grid: ( energy[i+1].grid_out - energy[i+1].grid_in - (entry.grid_out - entry.grid_in) ) / 
              ( timeDiff(entry.time, energy[i+1].time) / 3600 ),
        time: entry.time
      }
    }
    else {
      return undefined
    } 

  })
  //last power value is undefined, remove it
  power.splice(-1,1)

  return power
}

function updateMinMaxTime() { //TODO: get rid of repetition by passing an argument
  db.all('SELECT MIN(time) min, MAX(time) max FROM energy',
  (err, rows) => {
    console.log('updateMINMAX: ')
    console.log(rows);
    if (rows.length > 0) {
      //console.log(rows.length)
      //res.send(rows);
      t_min['energy'] = rows[0].min
      t_max['energy'] = rows[0].max
    } 
  }
  )
  db.all('SELECT MIN(time) min, MAX(time) max FROM power',
  (err, rows) => {
    console.log('updateMINMAX: ')
    console.log(rows);
    if (rows.length > 0) {
      //console.log(rows.length)
      //res.send(rows);
      t_min['power'] = rows[0].min
      t_max['power'] = rows[0].max
      console.log(rows[0].max)
      console.log(t_max['power'])
    } 
  }
  )
}

  
// returns time difference in seconds
function timeDiff(start,end) { 
  return moment(end).diff( moment(start), 'seconds' )
}

module.exports = router;
