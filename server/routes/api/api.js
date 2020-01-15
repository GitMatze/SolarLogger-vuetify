const express = require('express');
const sqlite3 = require('sqlite3');
const moment = require('moment');

const db = new sqlite3.Database('db.db');
const router = express.Router();

router.get('/MinMaxTime', (req, res) => {
 
  // db.all() fetches all results from an SQL query into the 'rows' variable:
  db.all(
    'SELECT MIN(time) min, MAX(time) max FROM power',    
    // callback function to run when the query finishes:
    (err, rows) => {
      // console.log(rows);
      if (rows.length > 0) {
        console.log(rows.length)
        console.log(rows[0])
        res.send(rows);
      } else {
        res.send([{}]); // failed, so return an empty object instead of undefined
      }
    }
  );
});


router.get('/power/:period', (req, res) => {
    const periods = req.params.period.split('_'); 
    console.log('period')
    console.log(periods[0])
    console.log(periods[1])
    
    modu = getFilterConstant(periods[0], periods[1], 10*60, 'seconds', 250)  

    
    // db.all() fetches all results from an SQL query into the 'rows' variable:
    db.all(
      'SELECT pv,grid,datetime(time, "localtime") time FROM power WHERE time>datetime($start) AND time<datetime($end) AND id%$mod=0 ORDER BY 3',
      // parameters to SQL query:
      {
        $start: periods[0],
        $end: periods[1],
        $mod: modu
      },
      // callback function to run when the query finishes:
      (err, rows) => {
        // console.log(rows);
        if (rows.length > 0) {
          console.log(rows.length)
          console.log(rows[0])
          res.send(rows);
        } else {
          res.send([{}]); // failed, so return an empty object instead of undefined
        }
      }
    );
  });


  // adding id%n=0 to the database query constraints will ensure
  // that number of outputs is around output_num
  //interval of data in database in seconds
  function getFilterConstant(start, end, interval, dim, output_num) {
    var te = moment(end)
    var ta = moment(start)
    var tdiff= te.diff(ta,dim) //time difference in seconds
    console.log(`tdiff ${tdiff}`)
    var n = Math.ceil(tdiff/(interval*output_num)) 
    return n
  }

module.exports = router;
