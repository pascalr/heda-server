import fs from 'fs';
import path from 'path';

import { ensureIsArray } from './utils.js';
import schema from './schema.js';
import sqlDb from './sql_db.js';

//import { findRecipeKindForRecipeName } from "./lib.js"
import {now} from './utils.js';

// FIXME: DB_URL should be DB_PATH, it's not an URL (doesn't start with sqlite3://...)
let dbPath = process.env.DB_URL
console.log('Database path:', dbPath)
console.log('Checking if database exists...')
if (fs.existsSync(dbPath)) {
  console.log('yes')
} else {
  console.log('no')
}
export const db = new sqlDb(dbPath, { verbose: console.log })
db.setSchema(schema)
console.log('Opening database successful!')

//function injectFunctions(obj, functions) {
//  functions.forEach(func => {
//    if (obj[func]) {throw "Can't inject function it already exists."}
//    obj[
//  })
//}

// TODO: Use long version instead of short version:
// DELETE FROM 'mixes' WHERE 'mixes.recipe_id' = 50.0
// instead of
// DELETE FROM 'mixes' WHERE recipe_id = 50.0
// I believe this is how ruby on rails does it.
// One advantages is that it allows to use keywords, for example 'references', as key
// Note: This does not work: DELETE FROM 'mixes' WHERE 'recipe_id' = 50.0

const ALLOWED_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'
const safe = (str, allowed) => {
  let s = '';
  [...str].forEach(c => {
    if (ALLOWED_CHARS.includes(c)) {s += c}
  })
  if (str != s) {throw "Error: User tried to send unsafe value."}
  if (!allowed.includes(s)) {throw "Error: Db value not allowed ("+s+")."}
  return "'"+s+"'"
}

// FIXME: The real schemaHelper is schema.
// TODO: Rename schema to schemaHelper, and rename schemaHelper to something else
// This is not a schemaHelper, it is a way to manipulate the db. It is more actually db...
// But it's more private, don't give access to this to outside?
// But still allow someone to modify it?
// FIXME: All this is really bad and ugly...
const schemaHelper = {}
schemaHelper.getTableList = () => {return Object.keys(schema)}
schemaHelper.getWriteAttributes = (table) => {return schema[table].write_attrs}
schemaHelper.getSecurityKey = (table) => {return schema[table].security_key}
schemaHelper.getAllowCreate = (table) => {return schema[table].allow_create}
schemaHelper.beforeCreate = (table, obj) => {
  if (!obj || !schema[table].before_create) {return obj}
  return schema[table].before_create(obj)
}
schemaHelper.validAttr = (table, field, value) => {
  let types = schema[table].attrs_types
  if (types && types[field]) {
    let type = types[field]
    if (type == 'bool') {
      return (value && value != 'false' && value != '0') ? 1 : 0
    }
  }
  return value
}

export const ALLOWED_TABLES_DESTROY = ['favorite_recipes', 'recipes', 'suggestions', 'tags']

// WARNING: Conditions keys are not safe. Never use user input for conditions keys.
function appendConditions(query0, args0, conditions) {
  let query = query0
  let args = args0
  Object.keys(conditions || {}).forEach(column => {
    query += ' AND '+column+' = ?'
    args.push(conditions[column])
  })
  return [query, args]
}

function addSafetyCondition(query0, args0, user, securityKey) {
  if (securityKey === 'ADMIN_ONLY') {
    if (!user.is_admin) {throw "Error not permitted user must be admin"}
    return [query0, args0]
  } else {
    if (!securityKey) {throw "Error in addSafetyCondition: security must exist"}
    if (!user[securityKey]) {throw "Error in addSafetyCondition: user must have security key"}
    let query = query0+' AND '+securityKey+' = ?'
    let args = [...args0, user[securityKey]]
    return [query, args]
  }
}

// TODO: Inside route update_field
// Fetch the old record by table and id
// Call something in the schemaHelper to know if the current user can edit it
// allow_update(user, obj, changes)
// allow_update(user, obj, {field: value})
if (db.safeUpdateRecord) {throw "Can't overide safeUpdateRecord"}
db.safeUpdateRecord = function(table, old, updated, user, options={}) {

  if (!table) {throw "Missing table for safeUpdateRecord"}

  let fields = []
  Object.keys(updated).forEach(f => {
    if (f === 'updated_at' || f === 'created_at' || f === 'id') {return}
    if (old[f] != updated[f]) {fields.push(f)}
  })
  
  let query = 'UPDATE '+safe(table, schemaHelper.getTableList())+' SET '+fields.map(field => safe(field, writeAttrs)+' = ?').join(', ')+', updated_at = ? WHERE id = ?'

  throw "TODO" // TODO
}

if (db.safeUpdateField) {throw "Can't overide safeUpdateField"}
db.safeUpdateField = function(table, id, field, value, user, options={}) {

  if (!table) {throw "Missing table for safeUpdateField"}

  let writeAttrs = schemaHelper.getWriteAttributes(table)
  if (options.allow_write) {writeAttrs = [...writeAttrs, ...options.allow_write]}
  let query0 = 'UPDATE '+safe(table, schemaHelper.getTableList())+' SET '+safe(field, writeAttrs)+' = ?, updated_at = ? WHERE id = ?'
  let args0 = [schemaHelper.validAttr(table, field, value), now(), id]
  const [query, args] = addSafetyCondition(query0, args0, user, schemaHelper.getSecurityKey(table))
  return db.prepare(query).run(...args)
}

// WARNING: Conditions keys are not safe. Never use user input for conditions keys.
if (db.destroyRecord) {throw "Can't overide destroyRecord"}
db.destroyRecord = function(table, id, conditions) {
  
  if (!table) {throw "Missing table for destroyRecord"}

  const query0 = 'DELETE FROM '+safe(table, ALLOWED_TABLES_DESTROY)+' WHERE id = ?'
  const args0 = [id]
  const [query, args] = appendConditions(query0, args0, conditions)
  let info = db.prepare(query).run(...args)
  if (info.changes != 1) {throw "Error destroying record from table "+table+" with id "+id}
}

if (db.destroyRecordWithDependants) {throw "Can't overide destroyRecordWithDependants"}
db.destroyRecordWithDependants = function(table, id, user) {
  
  if (!table) {throw "Missing table for destroyRecordWithDependants"}

  // First, make sure that the record is allowed to be destroyed by the user
  let q = 'SELECT id FROM ' +safe(table, schemaHelper.getTableList())+' WHERE id = ?'
  let [query, args] = addSafetyCondition(q, [id], user, schemaHelper.getSecurityKey(table))
  let r = db.prepare(query).get(...args)
  if (!r || !r.id) {throw "Error: Record not allowed to be destroyed."}
    
  let destroyWithDependants = db.transaction(record => {

    let o = schema[table].dependant_destroy || {}
    let foreignKeys = Object.keys(o)
    foreignKeys.forEach(foreignKey => {
   
      let tables = o[foreignKey]
      tables.forEach(dependantTable => {
        db.unsafeDestroyTableKey(dependantTable, foreignKey, record.id)
      })
    })

    db.safeDestroyRecord(table, record.id, user)
  })
  destroyWithDependants(r)
}

if (db.safeDestroyTableKey) {throw "Can't overide safeDestroyTableKey"}
db.safeDestroyTableKey = function(table, key, val, user) {
  
  if (!table) {throw "Missing table for safeDestroyTableKey"}

  const q = 'DELETE FROM '+safe(table, schemaHelper.getTableList())+' WHERE '+key+' = ?'
  const [query, args] = addSafetyCondition(q, [val], user, schemaHelper.getSecurityKey(table))
  return db.prepare(query).run(...args)
}

if (db.unsafeDestroyTableKey) {throw "Can't overide unsafeDestroyTableKey"}
db.unsafeDestroyTableKey = function(table, key, val) {
  
  if (!table) {throw "Missing table for unsafeDestroyRecord"}

  const q = 'DELETE FROM '+safe(table, schemaHelper.getTableList())+" WHERE "+key+" = ?"
  return db.prepare(q).run(val)
}

if (db.safeDestroyRecord) {throw "Can't overide safeDestroyRecord"}
db.safeDestroyRecord = function(table, id, user) {
  
  if (!table) {throw "Missing table for safeDestroyRecord"}

  let info = db.safeDestroyTableKey(table, 'id', id, user)
  if (info.changes != 1) {throw "Error destroying record from table "+table+" with "+key+" "+id}
}


export default db;
