import sqlite3 from 'sqlite3';

var db = new sqlite3.Database('./var/db/dev.db');

export default db;
//module.exports = db;
