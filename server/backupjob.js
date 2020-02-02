var Client = require('ftp');
var fs = require('fs');
var moment = require('moment')

// daily client
var c_d = new Client();
c_d.on('ready', function() {
  c_d.put('db.db', `/SolarBackups/aktuell.db`, function(err) {
    if (err) throw err;
    c_d.end();
  });
});

// monthly client
var c_m = new Client();
c_m.on('ready', function() {
  c_m.put('db.db', `/SolarBackups/${moment().format('YYYYMMDD_kkmmss')}.db`, function(err) {
    if (err) throw err;
    c_m.end();
  });
});

var CronJob = require('cron').CronJob;
var job_daily = new CronJob('0 0 0 * * *', function() {
    c_d.connect({host: 'fritz.box', user: 'solarlogger', password: 'einpasswort'});
}, null, true);

//safe monthly 
var job_monthly = new CronJob('0 0 0 1 * *', function() {
  c_m.connect({host: 'fritz.box', user: 'solarlogger', password: 'einpasswort'});
}, null, true);

//job.start();

module.exports = {daily: job_daily, monthly: job_monthly};