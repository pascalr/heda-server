import sqlite3 from 'sqlite3';
import fs from 'fs';

import {RECIPE_ATTRS} from './gon.js';
import utils from './utils.js';

https://stackoverflow.com/questions/53299322/transactions-in-node-sqlite3
if (sqlite3.Database.prototype.runAsync) {throw "Can't overide runAsync"}
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
if (sqlite3.Database.prototype.runBatchAsync) {throw "Can't overide runBatchAsync"}
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
  if (!allowed.includes(s)) {throw "Error: Db value not allowed ("+s+")."}
  return s
}

// TODO: Refactor all of this and put this in a schema.

export const ALLOWED_COLUMNS_MOD = {
  'recipes': ['name', 'main_ingredient_id', 'preparation_time', 'cooking_time', 'total_time', 'json', 'use_personalised_image', 'image_id', 'ingredients', 'recipe_kind_id'],
  'users': ['name', 'gender', 'image_slug', 'locale'],
  'favorite_recipes': ['list_id', 'recipe_id'],
  'tags': ['name', 'image_slug', 'position'],
  'suggestions': ['tag_id', 'recipe_id']
}
// WARNING: All users have access to these
export const ALLOWED_COLUMNS_GET = {
  'recipes': RECIPE_ATTRS
}
export const ALLOWED_TABLES_DESTROY = ['favorite_recipes', 'recipes', 'suggestions']

export const BEFORE_CREATE = {
  'recipes': (recipe, callback) => {
    fetchTable('recipe_kinds', {}, ['name'], (recipe_kinds) => {
      const recipeKind = findRecipeKindForRecipeName(recipe.name, recipe_kinds)
      if (recipeKind) {recipe.recipe_kind_id = recipeKind.id}
      callback(recipe)
    })
  }
}

// WARNING: Conditions keys are not safe. Never use user input for conditions keys.
if (sqlite3.Database.prototype.updateField) {throw "Can't overide updateField"}
sqlite3.Database.prototype.updateField = function(table, id, field, value, conditions, callback) {

  let query = 'UPDATE '+db.safe(table, Object.keys(ALLOWED_COLUMNS_MOD))+' SET '+db.safe(field, ALLOWED_COLUMNS_MOD[table])+' = ?, updated_at = ? WHERE id = ?'
  let args = [value, utils.now(), id]
  Object.keys(conditions || {}).forEach(column => {
    query += ' AND '+column+' = ?'
    args.push(conditions[column])
  })
  db.run(query, args, function(err) {
    callback(err)
  })
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
