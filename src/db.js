import sqlite3 from 'sqlite3';
import fs from 'fs';

https://stackoverflow.com/questions/53299322/transactions-in-node-sqlite3
sqlite3.Database.prototype.runAsync = function (sql, ...params) {
  return new Promise((resolve, reject) => {
    this.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
};
//var statements = [
//    "DROP TABLE IF EXISTS foo;",
//    "CREATE TABLE foo (id INTEGER NOT NULL, name TEXT);",
//    ["INSERT INTO foo (id, name) VALUES (?, ?);", 1, "First Foo"]
//];
//db.runBatchAsync(statements).then(results => {
//    console.log("SUCCESS!")
//    console.log(results);
//}).catch(err => {
//    console.error("BATCH FAILED: " + err);
//});
sqlite3.Database.prototype.runBatchAsync = function (statements) {
    var results = [];
    var batch = ['BEGIN', ...statements, 'COMMIT'];
    return batch.reduce((chain, statement) => chain.then(result => {
        results.push(result);
        return db.runAsync(...[].concat(statement));
    }), Promise.resolve())
    .catch(err => db.runAsync('ROLLBACK').then(() => Promise.reject(err +
        ' in statement #' + results.length)))
    .then(() => results.slice(2));
};

const ALLOWED_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'
if (sqlite3.Database.prototype.safe) {throw "Can't overide safe"}
sqlite3.Database.prototype.safe = function(str, allowed) {
  let s = '';
  [...str].forEach(c => {
    if (ALLOWED_CHARS.includes(c)) {s += c}
  })
  if (str != s) {throw "Error: User tried to send unsafe value."}
  if (!allowed.includes(s)) {throw "Error: Db value not allowed."}
  return s
}

// FIXME: DB_URL should be DB_PATH, it's not an URL (doesn't start with sqlite3://...)
let dbPath = process.env.DB_URL
console.log('Database path:', dbPath)
console.log('Checking if database exists...')
if (fs.existsSync(dbPath)) {
  console.log('yes')
} else {
  console.log('no')
}
var db = null;
try {
  db = new sqlite3.Database(dbPath);
  console.log('Opening database successful!')
} catch (err) {
  console.log('Error opening sqlite3 Database:', err)
  console.log('Opening temp file')
  db = new sqlite3.Database('./temp.db');
}

export default db;
//module.exports = db;
