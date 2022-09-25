import sqlite3 from 'sqlite3';

// FIXME: DB_URL should be DB_PATH, it's not an URL (doesn't start with sqlite3://...)
var db = new sqlite3.Database(process.env.DB_URL);

export default db;
//module.exports = db;
