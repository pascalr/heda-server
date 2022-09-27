import sqlite3 from 'sqlite3';
import fs from 'fs';

// FIXME: DB_URL should be DB_PATH, it's not an URL (doesn't start with sqlite3://...)
let dbPath = process.env.DB_URL
console.log('Database path: ', dbPath)
console.log('Checking if database exists...')
if (fs.existsSync(dbPath)) {
  console.log('yes')
} else {
  console.log('no')
}
var db = new sqlite3.Database(dbPath);

export default db;
//module.exports = db;
