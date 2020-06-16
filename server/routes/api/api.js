const express = require('express');
const dm = require('./datamanager')

const router = express.Router();

// dm.tMinMax('energy')

router.get('/MinMaxTime/:type', async (req, res) => {
  const type = req.params.type
  try {
    result = await dm.getMinMax(type)
    res.send(result)
  } 
  catch(err) {
    console.log(err)
    res.send([{}])
  }  
})

// api for heating control of water storage
// THIS ACTS AS THE POST METHOD AS WELL
router.get('/water_control/:data', (req, res) => {
  try {
  const data = req.params.data.split('_')
  const temp = parseInt(data[0])  // current water temperature
  const req_power = parseInt(data[1]) // requested power
  console.log(data)
  
  let grid = dm.getCurrent('grid_power')
  let is_heating = req_power+grid<0 && temp<60

  dm.update('water_temp',temp)
  dm.update('is_heating', is_heating)

  res.send([ {heat_on: is_heating ? "y": "n", grid: grid} ])    
  }
  catch (err) {
    console.log("GET heat error")
    console.log(err)
    res.send( [{}] )
  }
})

router.post('/pv', async (req, res) => { 
  dm.update('pv_power',req.body.power)
  dm.update('pv_energy',req.body.energy)
  res.status(201).send();
});

router.post('/grid', async (req, res) => { 
  dm.update('grid_power',req.body.power)
  dm.update('grid_in_energy',req.body.energy_in)
  dm.update('grid_out_energy',req.body.energy_out)
  res.status(201).send();
});


router.get('/current/:type', (req, res) => { 
  type = req.params.type
  switch (type) {

    case 'electricity':
      var time = dm.MinTimeString(dm.getTime('pv_power'),dm.getTime('grid_power'))  // select oldest time stamp       
      res.send( [{power: {pv: dm.getCurrent('pv_power'),
                      grid: dm.getCurrent('grid_power')                             
                    },
              energy: {pv: dm.getCurrent('pv_energy'),
                       grid_in: dm.getCurrent('grid_in_energy'),
                       grid_out: dm.getCurrent('grid_out_energy')
                    },
              time: time
      }])
      break

      case 'water_temp':  
        res.send( [{
          water_temp: dm.getCurrent('water_temp'),
          is_heating: dm.getCurrent('is_heating'),
          time: dm.getTime('water_temp')
        }] ) 
  }
  
})


router.get('/period/:period/:type', async (req, res) => {
  try {
    const periods = req.params.period.split('_');
    console.log('') 
    console.log(`Starttime: ${periods[0]}`)
    console.log(`Endtime: ${periods[1]}`)
    type = req.params.type

    let data = await dm.getPeriod(type, periods[0], periods[1]) 
    res.send( data )
  } catch(err) {
    console.log(err)
    res.send([{}])
  } 
})

router.get('/energy/:data', async (req, res) => {
  try {
    const data = req.params.data.split('_')
    const type = data[0]
    const period = [ data[1], data[2] ]
    console.log('')
    console.log('GET REQUEST statistics')
    console.log(data)
    const rows = await dm.getEnergyStats(type, period[0], period[1])
    res.send( rows) 
  } catch(err) {
    res.send([{}])
  }

})




  module.exports = router;
