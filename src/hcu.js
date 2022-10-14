import { useState, useEffect } from 'react';
import toastr from 'toastr'

import { ajax } from "./react/utils"

export const useHcuState = (initial, options, callback=null) => {
  if (!Array.isArray(initial)) { throw "Error: useHcuState requires an array as input" }
  
  const {tableName} = options;

  const [state, setState] = useState(initial.map(o => ({...o, table_name: tableName})))

  useEffect(() => {
    window.hcu.setters[tableName] = setState
  }, [])

  useEffect(() => {
    window.hcu.getters[tableName] = state
  }, [state])

  return state
}

// This method is private. Maybe do a public one, but then do a deep copy.
function getCurrentTable(tableName) {
  if (!tableName) {throw "Error can't get table for missing missing table."}
  let current = window.hcu.getters[tableName]
  if (!current) {throw "Error missing table " + tableName + ". useHcuState not called?"}
  return current
}

function updateTable(tableName, func) {
  let old = getCurrentTable(tableName)
  let updated = func(old)
  window.hcu.setters[tableName](updated)
}

export const initHcu = () => {
  if (window.hcu) {return;}
  window.hcu = {}
  window.hcu.getters = {}
  window.hcu.setters = {}
  window.hcu.updateField = (model, field, value, successCallback=null) => {
    console.log(`updateField record=${model.table_name} field=${field} from ${model[field]} to ${value}.`)
    if (value != model[field]) { // update only if value changed

      //let data = {[model.table_name+"["+field+"]"]: value}
      let data = {field, value}
      ajax({url: '/update_field/'+model.table_name+'/'+model.id, type: 'PATCH', data: data, success: () => {
        window.hcu.changeField(model, field, value, successCallback)
      }, error: (errors) => {
        console.log('ERROR AJAX UPDATING...', errors.responseText)
        toastr.error(errors.responseText)
        //toastr.error("<ul>"+Object.values(JSON.parse(errors)).map(e => ("<li>"+e+"</li>"))+"</ul>", 'Error updating')
      }})
    }
  }
  // Change record in memory only
  window.hcu.changeOnlyField = (tableName, id, field, value, successCallback=null) => {
    console.log(`changeOnlyField record=${tableName} id=${id} field=${field} to ${value}.`)
    let updatedRecord = null
    updateTable(tableName, old => (old.map(r => {
      if (r.id == id) {
        updatedRecord = {...r, [field]: value}
        return updatedRecord
      } 
      return r
      })
    ))
    if (successCallback) {successCallback(updatedRecord)}
  }
  // Change record in memory only
  window.hcu.changeField = (record, field, value, successCallback=null) => {
    console.log(`changeField record=${record.table_name} field=${field} from ${record[field]} to ${value}.`)
    window.hcu.changeOnlyField(record.table_name, record.id, field, value, successCallback)
  }
  window.hcu.createRecord = (tableName, record, successCallback=null) => {
    console.log('createRecord('+tableName+')', record)
    let fields = Object.keys(record)
    let url = '/create_record/'+tableName
    ajax({url: url, type: 'POST', data: {record, fields}, success: (created) => {
      console.log('created', created)
      window.hcu.addRecord(tableName, created, successCallback)
    }, error: (errors) => {
      console.log('ERROR AJAX CREATING...', errors.responseText)
      toastr.error(errors.responseText)
    }})
  }
  // Add record in memory only
  window.hcu.addRecord = (tableName, record, callback=null) => {
    console.log('addRecord('+tableName+')', record)
    updateTable(tableName, old => [...old, {...record, table_name: tableName}])
    if (callback) {callback(record)}
  }
  window.hcu.fetchRecord = (tableName, id, successCallback=null) => {
    let url = '/fetch_record/'+tableName+'/'+id
    ajax({url: url, type: 'GET', data: {}, success: (fetched) => {
      console.log('fetched', fetched)
      let old = getCurrentTable(tableName)
      if (old.find(r => r.id == fetched.id)) {throw "Error: Fetched a record already available"}
      updateTable(tableName, old => [...old, {...fetched, table_name: tableName}])
      if (successCallback) {successCallback(fetched)}
    }, error: (errors) => {
      console.log('ERROR AJAX FETCHING...', errors.responseText)
      toastr.error(errors.responseText)
    }})
  }
  // Remove record in memory only
  window.hcu.removeRecord = (record, successCallback=null) => {
    if (!record.table_name) { throw "Error: hcu.removeRecord record must have valid table_name" }
    updateTable(record.table_name, old => old.filter(e => e.id != record.id))
    if (successCallback) {successCallback()}
  }
  // Destroy record definitely in database
  window.hcu.destroyRecord = (record, successCallback=null) => {
    if (!record.table_name) { throw "Error: hcu.destroyRecord record must have valid table_name" }
    let url = '/destroy_record/'+record.table_name+'/'+record.id
    ajax({url: url, type: 'DELETE', success: (status) => {
      window.hcu.removeRecord(record, successCallback)
    }, error: (errors) => {
      console.log('ERROR AJAX DESTROYING...', errors.responseText)
      toastr.error(errors.responseText)
    }})
  }

  //mods => [
  //  {method: 'CREATE', record: {...}},
  //  {method: 'CREATE', record: {...}},
  //  {method: 'UPDATE', tableName: "...", id: "...", field: "...", value: "..."}
  //  {method: 'DELETE', tableName: "...", id: "..."}
  //]
  window.hcu.batchModify = (mods) => {
    let data = {mods: JSON.stringify(mods)}
    ajax({url: '/batch_modify/', type: 'PATCH', data, success: (status) => {
      mods.forEach(({method, tableName, id, field, value}) => {
        if (method == 'UPDATE') {
          window.hcu.changeOnlyField(tableName, id, field, value)
        }
      })
      // TODO: Go through all the modifications and apply them in memory
    }, error: (errors) => {
      console.log('ERROR AJAX BATCH MODIFY...', errors.responseText)
      toastr.error(errors.responseText)
    }})
  }
}
