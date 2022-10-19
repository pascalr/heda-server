import React, { useState, useEffect, useRef } from 'react'
import autocomplete from 'js-autocomplete';

import { normalizeSearchText, colorToHexString, hexStringToColor, Utils, ajax } from './utils'
import { DeleteConfirmButton } from './components/delete_confirm_button'

import { image_slug_variant_path } from "./routes"
import { t } from '../translate'

export const TextInput = ({defaultValue, onBlur}) => {
  const [value, setValue] = useState(defaultValue)

  return (
    <input type="text" value={value||''} onChange={(e) => setValue(e.target.value)} onBlur={() => onBlur(value)} />
  )
}

export const TextInputField = ({model, field}) => {
  const [value, setValue] = useState(model.currentValue(field))

  return (
    <input type="text" value={value||''} name={model.fieldName(field)}
      id={field} onChange={(e) => setValue(e.target.value)}
      onBlur={() => model.updateValue(field, value)} />
  )
}

export const AutocompleteInput = ({minChars, name, defaultValue, choices, placeholder, onSelect, inputRef, onBlur}) => {

  let selected = false

  inputRef ||= useRef(null);
  useEffect(() => { // Same as componentDidMount

    if (inputRef.current) {
      console.log('new autocomplete')
      let my_autocomplete = new autocomplete({
        selector: inputRef.current,
        minChars: minChars == null ? 1 : minChars,
        source: function(term, suggest){
          term = normalizeSearchText(term)
          const matches = [];
          for (const idx in choices) {
            let item = choices[idx]
            if (item.name && ~normalizeSearchText(item.name).indexOf(term)) {
              matches.push(idx);
            }
          }
          suggest(matches);
        },
        renderItem: function (idx, search){
          let item = choices[idx]
          search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
          let r = '<a class="autocomplete-suggestion id="'+idx+'" data-id="'+item.id+'" href="'+item.url+'">'
          if (item.image) {r += '<img src="'+item.image+'"></img>'}
          r += item.name.replace(re, "<b>$1</b>") + '</a>';
          return r
        },
        onSelect: (e, term, item) => {selected=true; onSelect(e, term, item)},
      })
      return () => {
        my_autocomplete.destroy()
      }
    }
  }, [])
  return <>
    <input type="search" name={name} id={name} placeholder={placeholder} defaultValue={defaultValue} aria-label="Search" autoComplete="off" ref={inputRef} onBlur={() => {
      if (selected) {selected = false; return}
      onBlur ? onBlur(inputRef.current.value) : null}
    }/>
  </>
}

// onUpdate is a callback to set the state
// onServerUpdate is a callback to handle the data returned by the controllers update method

export const clearRecord = (record) => {
  return {id: record.id, table_name: record.table_name, onUpdate: record.onUpdate, onServerUpdate: record.onServerUpdate}
}
export const updateRecord = (oldRecord, newRecord, nested={}) => {
  let obj = {...oldRecord, ...newRecord}
  for (const key in nested) {
    obj[key] = {...oldRecord[key], ...newRecord[key], ...nested[key]}
    //obj[key] = updateRecord(obj[key], nested[key])
  }
  return obj
}

export const ImageSelector = ({record, field, maxSizeBytes, suggestions, width, height, defaultImage, ...props}) => {
  
  const imagePath = record[field] ? image_slug_variant_path(record[field], 'fixme') : defaultImage
  
  return <>
    <div className='d-flex align-items-center'>
      <img style={{height, width}} src={imagePath} />
      {record[field] ? <DeleteConfirmButton id={`del-im-${record.id}`} onDeleteConfirm={() => window.hcu.updateField(record, field, null)} message="Je veux enlever cette image?" /> : ''}
    </div>
    <ImageField {...{record, field, maxSizeBytes}} />
    {record[field] || !suggestions || suggestions.length == 0 ? '' : <>
      <br/><br/>
      <h6>{t('Image_suggestions')}:</h6>
      <div className="d-flex align-items-center flex-wrap">
        {suggestions.map(slug => (
          <div key={slug} style={{width: "fit-content"}}>
            <img className="clickable" style={{height: "100px"}} src={image_slug_variant_path(slug, "square")} height="80" onClick={() => window.hcu.updateField(record, field, slug)} />
          </div>
        ))}
      </div>
    </>}
  </>
}
export const ImageField = ({record, field, maxSizeBytes, ...props}) => {
  if (record[field]) {return ''} // Only show the field when not set
  const handleChange = (e) => {
    console.log('File selected in FileField.')
    if (e.target.files.length > 1) {
      alert('Error. You can only upload one file.');
      return;
    }
    var file = e.target.files[0];
    if (maxSizeBytes && file.size > maxSizeBytes) {
      alert(`Error. Max upload size is ${maxSizeBytes/1000.0}kb. Was ${file.size/1000.0}kb.`);
      return;
    }
    let data = new FormData()
    data.append('file', file)
    if (record) {
      data.append('record_table', record.table_name)
      data.append('record_id', record.id)
      data.append('record_field', field)
    }
    ajax({url: '/upload_image', type: 'POST', data, success: (image) => {
      window.hcu.addRecord('images', image)
      let ext = image.filename.substr(image.filename.lastIndexOf('.') + 1);
      let val = `${image.id}.${ext}`
      window.hcu.changeField(record, field, val)
    }})
  }
  return <input type="file" name='file' {...props} onChange={handleChange} />
}
export const FileField = ({model, field, maxSizeBytes, onRemove, onImageCreated, ...props}) => {
  let id = `${model.table_name}_${field}`
  const handleChange = (e) => {
    console.log('File selected in FileField.')
    if (e.target.files.length > 1) {
      alert('Error. You can only upload one file.');
      return;
    }
    var file = e.target.files[0];
    if (maxSizeBytes && file.size > maxSizeBytes) {
      alert(`Error. Max upload size is ${maxSizeBytes/1000.0}kb. Was ${file.size/1000.0}kb.`);
      return;
    }
    let data = new FormData()
    data.append(field, file)
    data.append('field', field)
    ajax({url: '/upload_image', type: 'POST', data, success: (image) => {
      onImageCreated(image)
    }})
  }
  if (!model.filename) {
    return (<>
      <input type="file" name={field} id={id} {...props} onChange={handleChange} />
    </>)
  } else {
    return (
      <span>
        {model.filename}
        <DeleteConfirmButton id={`del-im-${model.id}`} onDeleteConfirm={onRemove} message="Je veux enlever cette image?" />
      </span>
    )
  }
}

// Generates a button that when you press it, it toggles the boolean attribute.
export const ToggleField = ({model, field, labelOn, labelOff, ...props}) => {
  const on = labelOn || "True"
  const off = labelOff || "False"
  return <div {...props} onClick={() => window.hcu.updateField(model, field, !model[field])}>
    {model[field] ? on : off}
  </div> 
}

export const RadioField = ({model, field, value, label, ...props}) => {
  let id = `${model.table_name}_${field}_${value}`
  return (<>
    <input type="radio" value={value} name={model.table_name+"["+field+"]"}
      id={id} {...props} checked={model[field] == value}
      onChange={(e) => {window.hcu.updateField(model, field, value)}}
    />
    {label ? <label htmlFor={id}>{' '}{label}</label> : ''}
          
  </>)
}
export const updateRecordField = (model, field, value, url, getter, setter) => {
  ajax({url: url, type: 'PATCH', data: {[model.table_name+"["+field+"]"]: value}, success: (record) => {
    let records = getter.map(r => {
      if (r.id == model.id) {
        r = {...r, [field]: value}
      }
      return r
    })
    setter(records)
  }, error: () => {
    console.log('Error updating the record field.', field)
  }})
}
// size, maxlength
export const TextField = ({model, field, inputRef, onUpdate, url, getter, setter, ...props}) => {
  const [value, setValue] = useState(model[field])
  
  return (
    <input type="text" value={value||''} name={model.table_name+"["+field+"]"} id={field} ref={inputRef} {...props}
      onChange={(e) => setValue(e.target.value)}
      onBlur={(e) => {window.hcu.updateField(model, field, value)}} />
  )
}
export const EditableField = ({model, field}) => {
  return (
    <div contentEditable suppressContentEditableWarning={true} name={model.table_name+"["+field+"]"}
         id={field} onBlur={(e) => {updateModelField(model, field, e.target.innerText)}} >
      {model[field]||''} 
    </div>
  )
}
export const ColorField = ({model, field}) => {
  //let value = Utils.colorToHexString(model[field])
  const [value, setValue] = useState(Utils.colorToHexString(model[field]))
        //onChange={(e) => {let v = e.target.value; console.log(v); updateModelField(model, field, Utils.hexStringToColor(v), () => setValue(v))}} />
        //onChange={(e) => {updateModelField(model, field, Utils.hexStringToColor(e.target.value))}} />
  return (
    <input type="color" value={value||''} name={model.table_name+"["+field+"]"} id={field}
        onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => {updateModelField(model, field, Utils.hexStringToColor(value))}} />
  )
}
/**
 * Generates a select tag with the given options.
 * @param {Object} model - The model to modify
 * @param {String} field - The name of the field containing the id to be selected
 * @param {Array} options - An array of values for setting the field
 * @param {Array} showOption - A function to show the option. (option) => howToPrint(option)
 * @param {Boolean} includeBlank - Whether to include blank or not
 */
// Example: <CollectionSelect model={recipe} field="recipe_kind_id" options={recipe_kinds.map(k => k.id)} showOption={(id) => recipe_kinds.find(k => k.id == id).name} includeBlank="true">
export const CollectionSelect = ({model, field, options, showOption, includeBlank, onChange}) => {
  const [value, setValue] = useState(model[field])

  const updateField = (e) => {
    let val = e.target.value
    if (onChange) {
      onChange(val)
    } else {
      window.hcu.updateField(model, field, val, () => setValue(val))
    }
  }

  return (
    <select name={model.table_name+"["+field+"]"} id={field} value={value||''} onChange={updateField}>
      {includeBlank ? <option value="" key="1" label=" "></option> : null}
      {options.map((opt, i) => {
        return <option value={opt} key={i+2}>{showOption(opt)}</option>
      })}
    </select>
  )
}

// cols, rows, placeholder
export const TextAreaField = ({ref, model, field, props, inputStyle, changeCallback=null}) => {
  const [value, setValue] = useState(model[field])

  return (
    <div className="field">
      <textarea value={value||''} name={field} id={field} style={inputStyle} {...props} onChange={(e) => {
        setValue(e.target.value);
        if(changeCallback) {changeCallback(e.target.value)}
      }} onBlur={() => window.hcu.updateField(model, field, value)} />
    </div>
  )
}
