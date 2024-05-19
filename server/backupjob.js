var Client = require('ftp');
var fs = require('fs');
var moment = require('moment')

// daily client
var c_d = new Client();
c_d.on('error', function (err) { console.log(err); });
c_d.on('ready', function () {
  try {
    c_d.put('db.db', `/SolarBackups/aktuell.db`, function (err) {
      c_d.end();
    });
  }
  catch (err) {
    console.log(`Daily Client Error: ${err.message}`)
  }
});

// monthly client
var c_m = new Client();
c_m.on('error', function (err) { console.log(err); });
c_m.on('ready', function () {
  try {
    c_m.put('db.db', `/SolarBackups/${moment().format('YYYYMMDD_kkmmss')}.db`, function (err) {
      c_m.end();
    });
  }
  catch (err) {
    console.log(`Monthly Client Error: ${err.message}`)
  }
});

var CronJob = require('cron').CronJob;
var job_daily = new CronJob('0 0 1 * * *', function () {
  try {
    c_d.connect({ host: 'fritz.box', user: 'solarlogger', password: 'einpasswort' });
    console.log('daily job')
  }
  catch (err) { console.log(`Daily Client Connction Error: ${err.message}`) }
}, null, true);

//safe monthly 
var job_monthly = new CronJob('0 0 1 1 * *', function () {
  try {
    c_m.connect({ host: 'fritz.box', user: 'solarlogger', password: 'einpasswort' });
  }
  catch (err) { console.log(`Monthly Client Connction Error: ${err.message}`) }
}, null, true);

//job.start();

module.exports = { daily: job_daily, monthly: job_monthly };
