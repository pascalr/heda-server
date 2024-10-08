import { useState, useEffect } from 'react';
import toastr from 'toastr'

import { now } from "./utils"
import { ajax } from "./react/utils"
import { t } from "./translate"

export const useHcuState = (initial, options, callback=null) => {
  if (!Array.isArray(initial)) { throw "Error: useHcuState requires an array as input" }
  
  const {tableName} = options;

  const [state, setState] = useState(initial.map(o => ({...o, table_name: tableName})))

  useEffect(() => {
    window.hcu.__state[tableName] = state
    window.hcu.setters[tableName] = setState
  }, [])

  //useEffect(() => {
  //  window.hcu.getters[tableName] = state
  //}, [state])

  return state
}

function getCurrentTable(tableName) {
  if (!tableName) {throw "Error can't get table for missing table: "+tableName}
  //let current = window.hcu.getters[tableName]
  let current = window.hcu.__state[tableName]
  if (!current) {
    throw "Error missing table " + tableName + ". useHcuState not called?"
  }
  return current
}

function updateTable(tableName, func) {
  let old = getCurrentTable(tableName)
  let updated = func(old)
  // Update the state in memory too because if updateTable is called multiple times
  // before the setState has been called, some changes will be lost.
  window.hcu.__state[tableName] = updated
  window.hcu.setters[tableName](updated)
}

export const handleError = (label) => (errors) => {
  console.error('ERROR AJAX responseText...', errors.responseText)
  console.error('ERROR AJAX...', errors)
  toastr.error(label)
}

export const initHcu = () => {
  if (window.hcu) {return;}
  window.hcu = {}
  //window.hcu.getters = {}
  window.hcu.__state = {}
  window.hcu.setters = {}
  window.hcu.updateField = (record, field, value, successCallback=null) => {
    if (!record.table_name) { throw "Error: hcu.updateField record must have a valid tableName" }
    //console.log(`updateField record=${record.table_name} field=${field} from ${record[field]} to ${value}.`)
    if (value != record[field]) { // update only if value changed

      let data = {field, value}
      ajax({url: '/update_field/'+record.table_name+'/'+record.id, type: 'PATCH', data: data, success: () => {
        window.hcu.changeField(record, field, value, successCallback)
      }, error: handleError(t('Error_updating')) })
    } else {
      console.log('Skipping updateField, value not modified.')
    }
  }
  // Change record in memory only
  window.hcu.changeOnlyField = (tableName, id, field, value, successCallback=null) => {
    if (!tableName) { throw "Error: hcu.changeOnlyField must have valid tableName" }
    //console.log(`changeOnlyField record=${tableName} id=${id} field=${field} to ${value}.`)
    let updatedRecord = null
    updateTable(tableName, old => (old.map(r => {
      if (r.id == id) {
        updatedRecord = {...r, [field]: value, updated_at: now()}
        return updatedRecord
      } 
      return r
      })
    ))
    if (successCallback) {successCallback(updatedRecord)}
  }
  // Change record in memory only
  window.hcu.changeField = (record, field, value, successCallback=null) => {
    if (!record.table_name) { throw "Error: hcu.changeField record must have a valid tableName" }
    //console.log(`changeField record=${record.table_name} field=${field} from ${record[field]} to ${value}.`)
    window.hcu.changeOnlyField(record.table_name, record.id, field, value, successCallback)
  }
  window.hcu.createRecord = (tableName, record, successCallback=null) => {
    if (!tableName) { throw "Error: hcu.createRecord must have valid tableName" }
    //console.log('createRecord('+tableName+')', record)
    let url = '/create_record/'+tableName
    ajax({url: url, type: 'POST', data: {record}, success: (created) => {
      //console.log('created', created)
      window.hcu.addRecord(tableName, created, successCallback)
    }, error: handleError(t('Error_creating')) })
  }
  // Add record in memory only
  window.hcu.addRecord = (tableName, record, callback=null) => {
    if (!tableName) { throw "Error: hcu.addRecord must have valid tableName" }
    //console.log('addRecord('+tableName+')', record)
    updateTable(tableName, old => [...old, {...record, table_name: tableName}])
    if (callback) {callback(record)}
  }
  // Check if the record is in memory
  window.hcu.hasRecord = (tableName, record) => {
    if (!tableName) { throw "Error: hcu.hasRecord must have valid tableName" }
    let table = getCurrentTable(tableName)
    return !!table.find(r => r.id == record.id)
  }
  //window.hcu.fetchRecord = (tableName, id, successCallback=null) => {
  //  if (!tableName) { throw "Error: hcu.fetchRecord must have valid tableName" }
  //  let url = '/fetch_record/'+tableName+'/'+id
  //  ajax({url: url, type: 'GET', success: (fetched) => {
  //    window.hcu.addRecord(tableName, fetched, successCallback)
  //  }, error: handleError(t('Error_fetching')) })
  //}
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
    }, error: handleError(t('Error_destroying')) })
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
    }, error: handleError(t('Error_updating')) })
  }
  window.hcu.makeDummy = () => {
    window.hcu.destroyRecord = window.hcu.removeRecord
    window.hcu.createRecord = window.hcu.addRecord
    window.hcu.updateField = window.hcu.changeField
  }
  // FIXME: Deep copy
  window.hcu.all = (tableName) => {
    return [...getCurrentTable(tableName)]
  }
  // FIXME: Deep copy
  window.hcu.find = (tableName, func) => {
    let found = getCurrentTable(tableName).find(func)
    return found ? {...found} : found
  }
}

/**
 * 
 * @param {*} record 
 * @param {string} field 
 * @param {*} value 
 * @param {function} successCallback 
 */
export const updateField = (record, field, value, successCallback=null) => {
  if (!record.table_name) { throw "Error: hcu.updateField record must have a valid tableName" }
  //console.log(`updateField record=${record.table_name} field=${field} from ${record[field]} to ${value}.`)
  if (value != record[field]) { // update only if value changed

    let data = {field, value}
    ajax({url: '/update_field/'+record.table_name+'/'+record.id, type: 'PATCH', data: data, success: () => {
      window.hcu.changeField(record, field, value, successCallback)
    }, error: handleError(t('Error_updating')) })
  } else {
    console.log('Skipping updateField, value not modified.')
  }
}