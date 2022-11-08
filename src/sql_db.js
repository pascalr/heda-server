import betterSqlite3 from 'better-sqlite3';
import path from 'path';

import {now} from './utils.js';

const getTableList = (schema) => {return Object.keys(schema)}
const getAllowCreate = (schema, table) => {return schema[table].allow_create}
const getWriteAttributes = (schema, table) => schema[table].write_attrs
const getSecurityAttributes = (schema, table) => {return schema[table].security_attrs}
const getIsAllowed = (schema, table) => {return schema[table].is_allowed}

const validAttr = (schema, table, field, value) => {
  let types = schema[table].attrs_types
  if (types && types[field]) {
    let type = types[field]
    if (type == 'bool') {
      return (value && value != 'false' && value != '0') ? 1 : 0
    }
  }
  return value
}

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

const fetchStatement = (schema, tableName, conditions, attributes, options) => {
  
  if (!tableName) {throw "Missing table for fetch"}

  let s = 'SELECT '+['id',...attributes.map(a => '"'+a+'"')].join(', ')+' FROM '+safe(tableName, getTableList(schema))
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

//if (db.fetchTable) {throw "Can't overide fetchTable"}
const sqlDb = {
  setSchema(schema) {this.___schema = schema},
  getSchema() {return this.___schema},

  fetchTable(tableName, conditions, attributes, options={}) {
    let o = fetchStatement(this.getSchema(), tableName, conditions, attributes, options)
    if (!o) return []
    let [s, a] = o
    return this.prepare(s).all(...a)
  },

  fetchRecord(tableName, conditions, attributes, options={}) {
    let o = fetchStatement(this.getSchema(), tableName, conditions, attributes, options)
    if (!o) return null
    let [s, a] = o
    return db.prepare(s).get(...a)
  },

  doBackup() {
  
    let outDir = process.env.DB_BACKUP_DIR
    if (!outDir) {throw "Error backing up db: missing environment variable DB_BACKUP_DIR"}
    
    let date = new Date()
    const months = ["janvier","fevrier","mars","avril","mai","juin","juillet","aout","septembre","octobre","novembre","decembre"];
    let month = months[date.getMonth()];
    let filename = `${date.getFullYear()}_${month}_${date.getDate()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.db`
  
    let name = path.join(outDir, filename)
    console.log('Starting backup up database to: ', name)
    this.backup(name)
    console.log('Database backup completed.')
  },

  createRecord(table, obj, manual, options={}) {
    
    if (!table) {throw "Missing table for createRecord"}
  
    let schema = this.getSchema()
    let securityAttrs = getSecurityAttributes(schema, table)
    let allowedCb = getIsAllowed(schema, table)
    if (!securityAttrs && !allowedCb) {throw "Missing security_attrs or user_allowed in schema for table "+table}
    if (allowedCb && !allowedCb(manual)) {throw "Create record not allowed."}

    let columns = getWriteAttributes(schema, table) || []
    if (options.allow_write) {columns = [...columns, ...options.allow_write]}
    let fields = Object.keys(obj).map(f => safe(f, columns))

    if (securityAttrs) {
      securityAttrs.forEach(attr => {
        obj[attr] = manual[attr]
        fields.push(attr)
      })
    }
    //let obj = getAllowCreate(schema, table)(user, unsafeObj)
    if (!obj) {throw "createRecord not allowed for current user"}
  
    let safeTable = safe(table, getTableList(schema))
    //obj = schemaHelper.beforeCreate(table, obj)
  
    let query = 'INSERT INTO '+safeTable+' (created_at,updated_at,'+fields.join(',')+') '
    query += 'VALUES (?,?,'+fields.map(f=>'?').join(',')+')'
    let args = [now(), now(), ...fields.map(f => validAttr(schema, table, f, obj[f]))]
    
    let info = this.prepare(query).run(...args)
    if (info.changes != 1) {throw "Error creating record from in "+table+"."}
    return {...obj, id: info.lastInsertRowid}
  },

  findAndDestroyRecord(table, id, user) {
    
    if (!table) {throw "Missing table for findAndDestroyRecord"}
  
    //let schema = this.getSchema()
    //let record = this.fetchRecord(table, {id: parseInt(id)}, schema[table].security_attrs)

    //// TODO: Validate record can be destroyed
  
    //const q = 'DELETE FROM '+safe(table, schemaHelper.getTableList())+' WHERE '+key+' = ?'
    //const [query, args] = addSafetyCondition(q, [val], user, schemaHelper.getSecurityKey(table))
    //let info = db.prepare(query).run(...args)
    //if (info.changes != 1) {throw "Error destroying record from table "+table+" with id "+id}
  },
}
function injectFunctions(obj, functionsObj) {
  Object.keys(functionsObj).map(name => {
    if (obj.prototype[name]) {throw "Can't inject function becasue it already exists."}
    obj.prototype[name] = functionsObj[name]
  })
}
injectFunctions(betterSqlite3, sqlDb)

export default betterSqlite3
