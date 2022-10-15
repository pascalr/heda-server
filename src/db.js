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
import {fetchTable, RECIPE_ATTRS} from './gon.js';
import utils from './utils.js';

const ALLOWED_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'
if (db.safe) {throw "Can't overide safe"}
db.safe = function(str, allowed) {
  let s = '';
  [...str].forEach(c => {
    if (ALLOWED_CHARS.includes(c)) {s += c}
  })
  if (str != s) {throw "Error: User tried to send unsafe value."}
  if (!allowed.includes(s)) {throw "Error: Db value not allowed ("+s+")."}
  return s
}

// FIXME: Rename attrs to something more like public_attrs, because these attributes can be modified
// when the user has a valid security key
const mySchema = {
  'recipe_kinds': {
    attrs: ['image_slug'],
  },
  'recipes': {
    attrs: ['name', 'main_ingredient_id', 'preparation_time', 'cooking_time', 'total_time', 'json', 'use_personalised_image', 'ingredients', 'recipe_kind_id', 'image_slug'],
    security_key: 'user_id'
  },
  'users': {
    attrs: ['name', 'gender', 'image_slug', 'locale'],
    security_key: 'account_id'
  },
  'favorite_recipes': {
    attrs: ['list_id', 'recipe_id'],
    security_key: 'user_id'
  },
  'tags': {
    attrs: ['name', 'image_slug', 'position'],
    security_key: 'user_id'
  },
  'suggestions': {
    attrs: ['tag_id', 'recipe_id'],
    security_key: 'user_id'
  }
}
const schema = {}
schema.getTableList = () => {return Object.keys(mySchema)}
schema.getFields = (table) => {return mySchema[table].attrs}
schema.getSecurityKey = (table) => {return mySchema[table].security_key}

//export const ALLOWED_COLUMNS_MOD = {
//  'recipe_kinds': ['image_slug'],
//  'recipes': ['name', 'main_ingredient_id', 'preparation_time', 'cooking_time', 'total_time', 'json', 'use_personalised_image', 'ingredients', 'recipe_kind_id', 'image_slug'],
//  'users': ['name', 'gender', 'image_slug', 'locale'],
//  'favorite_recipes': ['list_id', 'recipe_id'],
//  'tags': ['name', 'image_slug', 'position'],
//  'suggestions': ['tag_id', 'recipe_id']
//}
// WARNING: All users have access to these
export const ALLOWED_COLUMNS_GET = {
  'recipes': RECIPE_ATTRS
}
export const ALLOWED_TABLES_DESTROY = ['favorite_recipes', 'recipes', 'suggestions', 'tags']

const BEFORE_CREATE = {
  'recipes': (recipe) => {
    const recipeKinds = fetchTable('recipe_kinds', {}, ['name'])
    const recipeKind = findRecipeKindForRecipeName(recipe.name, recipeKinds)
    if (recipeKind) {recipe.recipe_kind_id = recipeKind.id}
    return recipe
  }
}

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

// WARNING: Conditions keys are not safe. Never use user input for conditions keys.
if (db.updateField) {throw "Can't overide updateField"}
db.updateField = function(table, id, field, value, conditions=null) {

  let query0 = 'UPDATE '+db.safe(table, schema.getTableList())+' SET '+db.safe(field, schema.getFields(table))+' = ?, updated_at = ? WHERE id = ?'
  let args0 = [value, utils.now(), id]
  const [query, args] = appendConditions(query0, args0, conditions)
  return db.prepare(query).run(...args)
}

function addSafetyCondition(query0, args0, user, securityKey) {
  if (!securityKey) {throw "Error in addSafetyCondition: security must exist"}
  if (!user[securityKey]) {throw "Error in addSafetyCondition: user must have security key"}
  let query = query0+' AND '+securityKey+' = ?'
  let args = [...args0, user[securityKey]]
  return [query, args]
}

if (db.safeUpdateField) {throw "Can't overide safeUpdateField"}
db.safeUpdateField = function(table, id, field, value, user) {

  let query0 = 'UPDATE '+db.safe(table, schema.getTableList())+' SET '+db.safe(field, schema.getFields(table))+' = ?, updated_at = ? WHERE id = ?'
  let args0 = [value, utils.now(), id]
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

if (db.safeDestroyRecord) {throw "Can't overide safeDestroyRecord"}
db.safeDestroyRecord = function(table, id, user) {

  const query0 = 'DELETE FROM '+db.safe(table, schema.getTableList())+' WHERE id = ?'
  const args0 = [id]
  const [query, args] = addSafetyCondition(query0, args0, user, schema.getSecurityKey(table))
  let info = db.prepare(query).run(...args)
  if (info.changes != 1) {throw "Error destroying record from table "+table+" with id "+id}
}

if (db.createRecord) {throw "Can't overide createRecord"}
db.createRecord = function(table, obj, userId) {
    
  let safeTable = db.safe(table, schema.getTableList())
  obj.user_id = userId 

  if (BEFORE_CREATE[safeTable]) {
    obj = BEFORE_CREATE[safeTable](obj)
  }

  let fields = Object.keys(obj)
  let columns = schema.getFields(safeTable)
  let query = 'INSERT INTO '+safeTable+' (created_at,updated_at,'+fields.map(f => db.safe(f, [...columns, 'user_id'])).join(',')+') '
  query += 'VALUES (?,?,'+fields.map(f=>'?').join(',')+')'
  let args = [utils.now(), utils.now(), ...Object.values(obj)]
  let info = db.prepare(query).run(...args)
  if (info.changes != 1) {throw "Error creating record from in "+table+"."}
  return {...obj, id: info.lastInsertRowid}
}

export default db;
