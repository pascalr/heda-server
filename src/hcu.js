import toastr from 'toastr'

  import { ajax } from "./react/utils"

export const initHcu = () => {
  if (window.hcu) {return;}
  window.hcu = {}
  window.hcu.getters = {}
  window.hcu.setters = {}
  window.hcu.updateField = (model, field, value, successCallback=null) => {
    if (value != model[field]) { // update only if value changed

      //let data = {[model.class_name+"["+field+"]"]: value}
      let data = {field, value}
      ajax({url: '/update_field/'+model.class_name+'/'+model.id, type: 'PATCH', data: data, success: () => {
        console.log(`Updating model ${model.class_name} field ${field} from ${model[field]} to ${value}.`)
        let record = {...model}
        record[field] = value
        let old = window.hcu.getters[record.class_name]
        let updated = [...old].map(r => r.id == record.id ? record : r)
        window.hcu.setters[record.class_name](updated)
        if (successCallback) {successCallback(record)}
      }, error: (errors) => {
        console.log('ERROR AJAX UPDATING...', errors.responseText)
        toastr.error(errors.responseText)
        //toastr.error("<ul>"+Object.values(JSON.parse(errors)).map(e => ("<li>"+e+"</li>"))+"</ul>", 'Error updating')
      }})
    }
  }
  window.hcu.createRecord = (record, successCallback=null) => {
    if (!record.class_name) { throw "Error: hcu.createRecord record must have valid class_name" }
    let fields = Object.keys(record)
    let url = '/create_record/'+record.class_name
    ajax({url: url, type: 'POST', data: {record, fields}, success: (created) => {
      console.log('created', created)
      let old = window.hcu.getters[record.class_name]
      let updated = [...old, {...created}]
      window.hcu.setters[record.class_name](updated)
      if (successCallback) {successCallback(created)}
    }, error: (errors) => {
      console.log('ERROR AJAX CREATING...', errors.responseText)
      toastr.error(errors.responseText)
    }})
  }
  // Remove record in memory only
  window.hcu.removeRecord = (record, successCallback=null) => {
    let old = window.hcu.getters[record.class_name]
    let updated = old.filter(e => e.id != record.id)
    window.hcu.setters[record.class_name](updated)
    if (successCallback) {successCallback()}
  }
  // Destroy record definitely in database
  window.hcu.destroyRecord = (record, successCallback=null) => {
    if (!record.class_name) { throw "Error: hcu.destroyRecord record must have valid class_name" }
    let url = '/destroy_record/'+record.class_name+'/'+record.id
    ajax({url: url, type: 'DELETE', success: (status) => {
      window.hcu.removeRecord(record, successCallback)
    }, error: (errors) => {
      console.log('ERROR AJAX CREATING...', errors.responseText)
      toastr.error(errors.responseText)
    }})
  }
}
