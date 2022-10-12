import { useState, useEffect } from 'react';
import toastr from 'toastr'

import { ajax } from "./react/utils"

//window.hcu.update(recipe)
//window.hcu.updateField(recipe)
export const useHcuState = (initial, options, callback=null) => {
  if (!Array.isArray(initial)) { throw "Error: useHcuState requires an array as input" }
  const [state, setState] = useState(initial)

  const {tableName} = options;

  useEffect(() => {
    window.hcu.setters[tableName] = setState
  }, [])

  useEffect(() => {
    window.hcu.getters[tableName] = state
  }, [state])

  return state
}

export const initHcu = () => {
  if (window.hcu) {return;}
  window.hcu = {}
  window.hcu.getters = {}
  window.hcu.setters = {}
  window.hcu.updateField = (model, field, value, successCallback=null) => {
    if (value != model[field]) { // update only if value changed

      //let data = {[model.table_name+"["+field+"]"]: value}
      let data = {field, value}
      ajax({url: '/update_field/'+model.table_name+'/'+model.id, type: 'PATCH', data: data, success: () => {
        console.log(`Updating model ${model.table_name} field ${field} from ${model[field]} to ${value}.`)
        window.hcu.changeField(model, field, value, successCallback)
      }, error: (errors) => {
        console.log('ERROR AJAX UPDATING...', errors.responseText)
        toastr.error(errors.responseText)
        //toastr.error("<ul>"+Object.values(JSON.parse(errors)).map(e => ("<li>"+e+"</li>"))+"</ul>", 'Error updating')
      }})
    }
  }
  // Change record in memory only
  window.hcu.changeField = (record, field, value, successCallback=null) => {
    let updatedRecord = {...record}
    updatedRecord[field] = value
    let old = window.hcu.getters[updatedRecord.table_name]
    let updated = [...old].map(r => r.id == updatedRecord.id ? updatedRecord : r)
    window.hcu.setters[updatedRecord.table_name](updated)
    if (successCallback) {successCallback(updatedRecord)}
  }
  window.hcu.createRecord = (record, successCallback=null) => {
    if (!record.table_name) { throw "Error: hcu.createRecord record must have valid table_name" }
    let fields = Object.keys(record)
    let url = '/create_record/'+record.table_name
    ajax({url: url, type: 'POST', data: {record, fields}, success: (created) => {
      console.log('created', created)
      let old = window.hcu.getters[record.table_name]
      let updated = [...old, {...created}]
      window.hcu.setters[record.table_name](updated)
      if (successCallback) {successCallback(created)}
    }, error: (errors) => {
      console.log('ERROR AJAX CREATING...', errors.responseText)
      toastr.error(errors.responseText)
    }})
  }
  window.hcu.fetchRecord = (tableName, id, successCallback=null) => {
    let url = '/fetch_record/'+tableName+'/'+id
    ajax({url: url, type: 'GET', data: {}, success: (fetched) => {
      console.log('fetched', fetched)
      let old = window.hcu.getters[tableName]
      if (old.find(r => r.id == fetched.id)) {throw "Error: Fetched a record already available"}
      let updated = [...old, {...fetched}]
      window.hcu.setters[tableName](updated)
      if (successCallback) {successCallback(fetched)}
    }, error: (errors) => {
      console.log('ERROR AJAX FETCHING...', errors.responseText)
      toastr.error(errors.responseText)
    }})
  }
  // Remove record in memory only
  window.hcu.removeRecord = (record, successCallback=null) => {
    let old = window.hcu.getters[record.table_name]
    let updated = old.filter(e => e.id != record.id)
    window.hcu.setters[record.table_name](updated)
    if (successCallback) {successCallback()}
  }
  // Destroy record definitely in database
  window.hcu.destroyRecord = (record, successCallback=null) => {
    if (!record.table_name) { throw "Error: hcu.destroyRecord record must have valid table_name" }
    let url = '/destroy_record/'+record.table_name+'/'+record.id
    ajax({url: url, type: 'DELETE', success: (status) => {
      window.hcu.removeRecord(record, successCallback)
    }, error: (errors) => {
      console.log('ERROR AJAX CREATING...', errors.responseText)
      toastr.error(errors.responseText)
    }})
  }
}
