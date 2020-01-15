// Node.js + Express server backend for petsapp
// v2 - use SQLite (https://www.sqlite.org/index.html) as a database
//
// COGS121 by Philip Guo
// https://github.com/pgbovine/COGS121

// run this once to create the initial database as the pets.db file
//   node create_database.js

// to clear the database, simply delete the pets.db file:
//   rm pets.db

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('db.db');

// run each database statement *serially* one after another
// (if you don't do this, then all statements will run in parallel,
//  which we don't want)
db.serialize(() => {
  // create a new database table:
  //db.run("CREATE TABLE power (id INTEGER PRIMARY KEY AUTOINCREMENT, pv INTEGER, grid INTEGER, time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL )");

  // insert 3 rows of data:
  //db.run("INSERT INTO power (pv, grid) VALUES (101, 201)"); 

  console.log('successfully created the power table in db.db');

  // print them out to confirm their contents:
  db.all("SELECT * FROM power", (err, res) => {
      console.log(res);
  });
});

db.close();
