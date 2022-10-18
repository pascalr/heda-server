import fs from 'fs';

import betterSqlite3 from 'better-sqlite3'
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

import { findRecipeKindForRecipeName } from "./lib.js"
import {RECIPE_ATTRS} from './gon.js';
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

const mySchema = {
  'meals': {},
  'mixes': {},
  'images': {
    write_attrs: ['filename', 'author', 'is_user_author', 'source'],
    attrs_types: {is_user_author: 'bool'},
    security_key: 'user_id',
  },
  'recipe_comments': {},
  'recipe_notes': {},
  'recipe_ratings': {},
  'recipe_tools' : {},
  'references' : {},
  'machine_users' : {},
  'machine_foods' : {},
  'machines' : {},
  'container_formats' : {},
  'container_quantities' : {},
  'containers' : {},
  'foods' : {},
  'units' : {},
  'recipe_kinds': {
    write_attrs: ['image_slug'],
  },
  'recipes': {
    write_attrs: ['name', 'main_ingredient_id', 'preparation_time', 'cooking_time', 'total_time', 'json', 'ingredients', 'recipe_kind_id', 'image_slug'],
    security_key: 'user_id',
    dependant_destroy: {recipe_id: ['favorite_recipes', 'meals', 'mixes', 'recipe_comments', 'recipe_notes', 'recipe_ratings', 'recipe_tools', 'references', 'suggestions']},

    before_create(recipe) {
      const recipeKinds = db.fetchTable('recipe_kinds', {}, ['name'])
      const recipeKind = findRecipeKindForRecipeName(recipe.name, recipeKinds)
      if (recipeKind) {recipe.recipe_kind_id = recipeKind.id}
      return recipe
    }
  },
  'users': {
    write_attrs: ['name', 'gender', 'image_slug', 'locale', 'is_public'],
    attrs_types: {is_public: 'bool'},
    security_key: 'account_id'
  },
  'favorite_recipes': {
    write_attrs: ['list_id', 'recipe_id'],
    security_key: 'user_id'
  },
  'tags': {
    write_attrs: ['name', 'image_slug', 'position'],
    security_key: 'user_id'
  },
  'suggestions': {
    write_attrs: ['tag_id', 'recipe_id'],
    security_key: 'user_id'
  }
}
// FIXME: The real schema is mySchema.
// TODO: Rename mySchema to schema, and rename schema to something else
// This is not a schema, it is a way to manipulate the db. It is more actually db...
// But it's more private, don't give access to this to outside?
// But still allow someone to modify it?
const schema = {}
schema.getTableList = () => {return Object.keys(mySchema)}
schema.getWriteAttributes = (table) => {return mySchema[table].write_attrs}
schema.getSecurityKey = (table) => {return mySchema[table].security_key}
schema.beforeCreate = (table, obj) => {
  if (!obj || !mySchema[table].before_create) {return obj}
  return mySchema[table].before_create(obj)
}
schema.validAttr = (table, field, value) => {
  let types = mySchema[table].attrs_types
  if (types && types[field]) {
    let type = types[field]
    if (type == 'bool') {
      return (value && value != 'false' && value != '0') ? 1 : 0
    }
  }
  return value
}

// WARNING: All users have access to these
export const ALLOWED_COLUMNS_GET = {
  'recipes': RECIPE_ATTRS
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
  if (!securityKey) {throw "Error in addSafetyCondition: security must exist"}
  if (!user[securityKey]) {throw "Error in addSafetyCondition: user must have security key"}
  let query = query0+' AND '+securityKey+' = ?'
  let args = [...args0, user[securityKey]]
  return [query, args]
}

if (db.safeUpdateField) {throw "Can't overide safeUpdateField"}
db.safeUpdateField = function(table, id, field, value, user, options={}) {

  let writeAttrs = schema.getWriteAttributes(table)
  if (options.allow_write) {writeAttrs = [...writeAttrs, ...options.allow_write]}
  let query0 = 'UPDATE '+db.safe(table, schema.getTableList())+' SET '+db.safe(field, writeAttrs)+' = ?, updated_at = ? WHERE id = ?'
  let args0 = [schema.validAttr(table, field, value), utils.now(), id]
  const [query, args] = addSafetyCondition(query0, args0, user, schema.getSecurityKey(table))
  return db.prepare(query).run(...args)
}

// WARNING: Conditions keys are not safe. Never use user input for conditions keys.
if (db.destroyRecord) {throw "Can't overide destroyRecord"}
db.destroyRecord = function(table, id, conditions) {

  const query0 = 'DELETE FROM '+db.safe(table, ALLOWED_TABLES_DESTROY)+' WHERE id = ?'
  const args0 = [id]
  const [query, args] = appendConditions(query0, args0, conditions)
  let info = db.prepare(query).run(...args)
  if (info.changes != 1) {throw "Error destroying record from table "+table+" with id "+id}
}

if (db.destroyRecordWithDependants) {throw "Can't overide destroyRecordWithDependants"}
db.destroyRecordWithDependants = function(table, id, user) {

  // First, make sure that the record is allowed to be destroyed by the user
  let q = 'SELECT id FROM ' +db.safe(table, schema.getTableList())+' WHERE id = ?'
  let [query, args] = addSafetyCondition(q, [id], user, schema.getSecurityKey(table))
  let r = db.prepare(query).get(...args)
  if (!r || !r.id) {throw "Error: Record not allowed to be destroyed."}
    
  let destroyWithDependants = db.transaction(record => {

    let o = mySchema[table].dependant_destroy || {}
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

  const q = 'DELETE FROM '+db.safe(table, schema.getTableList())+' WHERE '+key+' = ?'
  const [query, args] = addSafetyCondition(q, [val], user, schema.getSecurityKey(table))
  return db.prepare(query).run(...args)
}

if (db.unsafeDestroyTableKey) {throw "Can't overide unsafeDestroyTableKey"}
db.unsafeDestroyTableKey = function(table, key, val) {

  const q = 'DELETE FROM '+db.safe(table, schema.getTableList())+" WHERE "+key+" = ?"
  return db.prepare(q).run(val)
}

if (db.safeDestroyRecord) {throw "Can't overide safeDestroyRecord"}
db.safeDestroyRecord = function(table, id, user) {

  let info = db.safeDestroyTableKey(table, 'id', id, user)
  if (info.changes != 1) {throw "Error destroying record from table "+table+" with "+key+" "+id}
}

if (db.createRecord) {throw "Can't overide createRecord"}
db.createRecord = function(table, obj, userId, options={}) {
    
  let safeTable = db.safe(table, schema.getTableList())
  obj.user_id = userId 
  obj = schema.beforeCreate(table, obj)

  let fields = Object.keys(obj)
  let columns = schema.getWriteAttributes(table) || []
  if (options.allow_write) {columns = [...columns, ...options.allow_write]}
  let query = 'INSERT INTO '+safeTable+' (created_at,updated_at,'+fields.map(f => db.safe(f, [...columns, 'user_id'])).join(',')+') '
  query += 'VALUES (?,?,'+fields.map(f=>'?').join(',')+')'
  let args = [utils.now(), utils.now(), ...fields.map(f => schema.validAttr(table, f, obj[f]))]
  
  let info = db.prepare(query).run(...args)
  if (info.changes != 1) {throw "Error creating record from in "+table+"."}
  return {...obj, id: info.lastInsertRowid}
}

if (db.fetchTable) {throw "Can't overide fetchTable"}
db.fetchTable = function(tableName, conditions, attributes) {

  let s = 'SELECT '+['id',...attributes].join(', ')+' FROM '+db.safe(tableName, schema.getTableList())
  let a = []
  let l = Object.keys(conditions).length
  if (l != 0) {s += ' WHERE '}
  let keys = Object.keys(conditions)
  for (let i = 0; i < keys.length; i++) {
    let cond = keys[i]
    let val = conditions[cond]
    if (val == null) {
      s += cond + ' IS NULL'
    } else if (Array.isArray(val) && val.length == 0) {
      console.log('FetchTable an empty array given as a condition. Impossible match.')
      return []
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
  console.log('statement:', s)
  console.log('values', a)
  return db.prepare(s).all(...a)
}

export default db;
