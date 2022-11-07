import fs from 'fs';
import path from 'path';
import betterSqlite3 from 'better-sqlite3';

import { ensureIsArray } from './utils.js';
import schema from './schema.js';

// FIXME: DB_URL should be DB_PATH, it's not an URL (doesn't start with sqlite3://...)
let dbPath = process.env.DB_URL
console.log('Database path:', dbPath)
console.log('Checking if database exists...')
if (fs.existsSync(dbPath)) {
  console.log('yes')
} else {
  console.log('no')
}
export const db = new betterSqlite3(dbPath, { verbose: console.log })
console.log('Opening database successful!')

//import { findRecipeKindForRecipeName } from "./lib.js"
import utils from './utils.js';

// TODO: Use long version instead of short version:
// DELETE FROM 'mixes' WHERE 'mixes.recipe_id' = 50.0
// instead of
// DELETE FROM 'mixes' WHERE recipe_id = 50.0
// I believe this is how ruby on rails does it.
// One advantages is that it allows to use keywords, for example 'references', as key
// Note: This does not work: DELETE FROM 'mixes' WHERE 'recipe_id' = 50.0

const ALLOWED_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'
if (db.safe) {throw "Can't overide safe"}
db.safe = function(str, allowed) {
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
  
  let query = 'UPDATE '+db.safe(table, schemaHelper.getTableList())+' SET '+fields.map(field => db.safe(field, writeAttrs)+' = ?').join(', ')+', updated_at = ? WHERE id = ?'

  throw "TODO" // TODO
}

if (db.safeUpdateField) {throw "Can't overide safeUpdateField"}
db.safeUpdateField = function(table, id, field, value, user, options={}) {

  if (!table) {throw "Missing table for safeUpdateField"}

  let writeAttrs = schemaHelper.getWriteAttributes(table)
  if (options.allow_write) {writeAttrs = [...writeAttrs, ...options.allow_write]}
  let query0 = 'UPDATE '+db.safe(table, schemaHelper.getTableList())+' SET '+db.safe(field, writeAttrs)+' = ?, updated_at = ? WHERE id = ?'
  let args0 = [schemaHelper.validAttr(table, field, value), utils.now(), id]
  const [query, args] = addSafetyCondition(query0, args0, user, schemaHelper.getSecurityKey(table))
  return db.prepare(query).run(...args)
}

// WARNING: Conditions keys are not safe. Never use user input for conditions keys.
if (db.destroyRecord) {throw "Can't overide destroyRecord"}
db.destroyRecord = function(table, id, conditions) {
  
  if (!table) {throw "Missing table for destroyRecord"}

  const query0 = 'DELETE FROM '+db.safe(table, ALLOWED_TABLES_DESTROY)+' WHERE id = ?'
  const args0 = [id]
  const [query, args] = appendConditions(query0, args0, conditions)
  let info = db.prepare(query).run(...args)
  if (info.changes != 1) {throw "Error destroying record from table "+table+" with id "+id}
}

if (db.destroyRecordWithDependants) {throw "Can't overide destroyRecordWithDependants"}
db.destroyRecordWithDependants = function(table, id, user) {
  
  if (!table) {throw "Missing table for destroyRecordWithDependants"}

  // First, make sure that the record is allowed to be destroyed by the user
  let q = 'SELECT id FROM ' +db.safe(table, schemaHelper.getTableList())+' WHERE id = ?'
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

  const q = 'DELETE FROM '+db.safe(table, schemaHelper.getTableList())+' WHERE '+key+' = ?'
  const [query, args] = addSafetyCondition(q, [val], user, schemaHelper.getSecurityKey(table))
  return db.prepare(query).run(...args)
}

if (db.unsafeDestroyTableKey) {throw "Can't overide unsafeDestroyTableKey"}
db.unsafeDestroyTableKey = function(table, key, val) {
  
  if (!table) {throw "Missing table for unsafeDestroyRecord"}

  const q = 'DELETE FROM '+db.safe(table, schemaHelper.getTableList())+" WHERE "+key+" = ?"
  return db.prepare(q).run(val)
}

if (db.safeDestroyRecord) {throw "Can't overide safeDestroyRecord"}
db.safeDestroyRecord = function(table, id, user) {
  
  if (!table) {throw "Missing table for safeDestroyRecord"}

  let info = db.safeDestroyTableKey(table, 'id', id, user)
  if (info.changes != 1) {throw "Error destroying record from table "+table+" with "+key+" "+id}
}

if (db.safeCreateRecord) {throw "Can't overide safeCreateRecord"}
db.safeCreateRecord = function(table, unsafeObj, user, options={}) {
  
  if (!table) {throw "Missing table for createRecord"}

  let obj = schemaHelper.getAllowCreate(table)(user, unsafeObj)
  if (!obj) {throw "createRecord not allowed for current user"}

  let safeTable = db.safe(table, schemaHelper.getTableList())
  obj = schemaHelper.beforeCreate(table, obj)

  let fields = Object.keys(obj)
  let columns = schemaHelper.getWriteAttributes(table) || []
  if (options.allow_write) {columns = [...columns, ...options.allow_write]}
  let query = 'INSERT INTO '+safeTable+' (created_at,updated_at,'+fields.map(f => db.safe(f, columns)).join(',')+') '
  query += 'VALUES (?,?,'+fields.map(f=>'?').join(',')+')'
  let args = [utils.now(), utils.now(), ...fields.map(f => schemaHelper.validAttr(table, f, obj[f]))]
  
  let info = db.prepare(query).run(...args)
  if (info.changes != 1) {throw "Error creating record from in "+table+"."}
  return {...obj, id: info.lastInsertRowid}
}

if (db.createRecord) {throw "Can't overide createRecord"}
db.createRecord = function(table, obj, options={}) {
  
  if (!table) {throw "Missing table for createRecord"}
    
  let safeTable = db.safe(table, schemaHelper.getTableList())
  obj = schemaHelper.beforeCreate(table, obj)

  let fields = Object.keys(obj)
  let columns = schemaHelper.getWriteAttributes(table) || []
  if (options.allow_write) {columns = [...columns, ...options.allow_write]}
  let query = 'INSERT INTO '+safeTable+' (created_at,updated_at,'+fields.map(f => db.safe(f, columns)).join(',')+') '
  query += 'VALUES (?,?,'+fields.map(f=>'?').join(',')+')'
  let args = [utils.now(), utils.now(), ...fields.map(f => schemaHelper.validAttr(table, f, obj[f]))]
  
  let info = db.prepare(query).run(...args)
  if (info.changes != 1) {throw "Error creating record from in "+table+"."}
  return {...obj, id: info.lastInsertRowid}
}

if (db.doBackup) {throw "Can't overide doBackup"}
db.doBackup = function() {

  let outDir = process.env.DB_BACKUP_DIR
  if (!outDir) {throw "Error backing up db: missing environment variable DB_BACKUP_DIR"}
  
  let date = new Date()
  const months = ["janvier","fevrier","mars","avril","mai","juin","juillet","aout","septembre","octobre","novembre","decembre"];
  let month = months[date.getMonth()];
  let filename = `${date.getFullYear()}_${month}_${date.getDate()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.db`

  let name = path.join(outDir, filename)
  console.log('Starting backup up database to: ', name)
  db.backup(name)
  console.log('Database backup completed.')
}

const fetchStatement = (tableName, conditions, attributes, options) => {
  
  if (!tableName) {throw "Missing table for fetch"}

  let s = 'SELECT '+['id',...attributes.map(a => '"'+a+'"')].join(', ')+' FROM '+db.safe(tableName, schemaHelper.getTableList())
  let a = []
  if (Array.isArray(conditions)) {
    // The first element is the query, the second is the arguments
    s += ' WHERE '+conditions[0]
    a = ensureIsArray(conditions[1])
  } else {
    let l = Object.keys(conditions).length
    if (l != 0) {s += ' WHERE '}
    let keys = Object.keys(conditions)
    for (let i = 0; i < keys.length; i++) {
      //FIXME: Escape keys; let cond = "'"+keys[i]+"'"
      //Maybe it's «'», maybe it's «"» that's required, I don't know and it makes a difference. Select 'name' was not working...
      let cond = keys[i]
      let val = conditions[cond]
      if (val == null) {
        s += cond + ' IS NULL'
      } else if (Array.isArray(val) && val.length == 0) {
        console.log('fetchStatement: info: an empty array given as a condition. Impossible match.')
        return null
      } else if (Array.isArray(val) && val.length > 1) {
        s += cond + ' IN ('
        val.forEach((v,i) => {
          s += '?' + ((i < val.length - 1) ? ', ' : '')
          a.push(v)
        })
        s += ')'
      } else {
        s += cond + ' = ?'
        a.push(val)
      }
      if (i < l-1) {s += ' AND '}
    }
  }
  if (options.limit) {s += ' LIMIT '+parseInt(options.limit, 10)}
  console.log('statement:', s)
  console.log('values', a)
  return [s, a]
}

if (db.fetchTable) {throw "Can't overide fetchTable"}
db.fetchTable = function(tableName, conditions, attributes, options={}) {
  let o = fetchStatement(tableName, conditions, attributes, options)
  if (!o) return []
  let [s, a] = o
  return db.prepare(s).all(...a)
}

if (db.fetchRecord) {throw "Can't overide fetchRecord"}
db.fetchRecord = function(tableName, conditions, attributes, options={}) {
  let o = fetchStatement(tableName, conditions, attributes, options)
  if (!o) return null
  let [s, a] = o
  return db.prepare(s).get(...a)
}

export default db;
