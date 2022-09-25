import sqlite3 from 'sqlite3';

var db = new sqlite3.Database(process.env.DB_URL);

export default db;
//module.exports = db;
