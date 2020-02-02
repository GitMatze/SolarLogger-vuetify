const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

var jobs = require('./backupjob');
jobs.daily.start()
jobs.monthly.start()

// Middleware
app.use(bodyParser.json());
app.use(cors());

const api = require('./routes/api/api');

app.use('/api', api);

// Handle production
if (true) { //process.env.NODE_ENV === 'production') {
  // Static folder
  app.use(express.static(__dirname + '/public/'));

  // Handle SPA
  app.get(/.*/, (req, res) => res.sendFile(__dirname + '/public/index.html'));
}

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));
