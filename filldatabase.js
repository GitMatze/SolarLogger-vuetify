const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('db.db');
const moment = require('moment')

console.log(moment().subtract(10, 'hours').format('kk'))

var pv_day = {
    '00':0,
    '01':0,
    '02':0,
    '03':0,
    '04':1,
    '05':2,
    '06':50,
    '07':50,
    '08':100,
    '09':600,
    '10':1300,
    '11':4000,
    '12':5000,
    '13':6000,
    '14':6500,
    '15':6000,
    '16':5000,
    '17':4000,
    '18':1300,
    '19':600,
    '20':200,
    '21':1,
    '22':0,
    '23':0,
    '24':00
}

var pv_month = {
    '01':0.1,
    '02':0.2,
    '03':0.4,
    '04':0.6,
    '05':0.8,
    '06':1,
    '07':1,
    '08':0.8,
    '09':0.6,
    '10':0.4,
    '11':0.2,
    '12':0.1
}

var grid_day = {
    '00':0,
    '01':0,
    '02':0,
    '03':0,
    '04':1,
    '05':20,
    '06':50,
    '07':100,
    '08':300,
    '09':100,
    '10':100,
    '11':100,
    '12':300,
    '13':300,
    '14':800,
    '15':300,
    '16':100,
    '17':100,
    '18':100,
    '19':200,
    '20':100,
    '21':100,
    '22':50,
    '23':0,
    '24':0
}

var pv_v = 50
var grid_v = 0;

var hours = ''
var month = ''
var day_rand = 1
var c = 0

var start = '2020-01-17T22:00+01:00'
step = 4

db.run('DELETE FROM power')
// console.log(typeof moment().subtract(10, 'hours').format('MM'))
// console.log(grid_day[`${moment().subtract(i*4, 'seconds').format('kk')}`])

for(var i = 0;i<20000; i++) {

    c++;

    var hours = moment(start).subtract(i*step, 'seconds').format('kk')
    var month = moment(start).subtract(i*step, 'seconds').format('MM')

    if (hours == '01' && c > 70 ) {
        c = 0
        day_rand = Math.random()
        console.log(day_rand)
    }
    
    pv_v = pv_v + (pv_day[hours] * pv_month[month] * day_rand - pv_v) * 0.04 + Math.random()*30-15
    
    // console.log(`dayrand ${month} und pv ${pv_month['01']} und month ${pv_month[month]}`)
    if (pv_day[hours] == 0 || pv_v < 0) {pv_v = 0}
    
    grid_v = grid_v + (grid_day[hours]- grid_v) * 0.05 + Math.random()*30-15

    if (grid_v<0) {grid_v=-grid_v}
    if (pv_v + grid_v < 0) {grid_v = -pv_v}

   
    db.run(
        'INSERT INTO power (pv, grid, time) VALUES ($pv, $grid, datetime($time))',
        // parameters to SQL query:
        {
          $pv: pv_v,
          $grid: grid_v - pv_v,
          $time: moment(start).subtract(i*step, 'seconds').format()
        },
        // callback function to run when the query finishes:
        (err) => {
            if(err) {
                console.log(err.message)
            }
         
        })
}

