var sqlite3 = require('sqlite3');

var db = new sqlite3.Database('./var/db/dev.db');

module.exports = db;
