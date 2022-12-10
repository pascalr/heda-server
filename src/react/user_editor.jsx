import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { ToggleField, TextField, RadioField, ImageField, ImageSelector, CollectionSelect, TextInput, withInputField } from './form'
import { initHcu, useHcuState } from "../hcu"
import { ajax } from "../lib"
import { image_slug_variant_path } from "./routes"
import { t } from "../translate"

const UserEditor = () => {

  if (!window.hcu) {initHcu()}
  const users = useHcuState([gon.user], {tableName: 'users'})
  const user = users[0]
  window.locale = user.locale

  const destroyUser = () => {
    if (confirm(t('Confirm_destroy_profile'))) {
      let url = '/destroy_profile/'+user.id
      ajax({url, type: 'DELETE', success: (status) => {
        window.location.href = "/choose_user"
      }, error: (errors) => {
        console.log('ERROR AJAX DELETE...', errors.responseText)
        toastr.error(errors.responseText)
      }})
    }
  }

  let suggestions = ["125.png", "126.png", "127.png"]
    
    //<b>{t('Visibility')}</b><br/>
    //<ToggleField model={user} field="is_public" labelOn={t('public')} labelOff={t('private')} className="btn btn-primary" /><br/><br/>
    //{user.is_public ? <>
    //  <p>{t('n12')}</p>
    //  <a href={"/u/"+user.id}>{window.location.origin}/u/{user.id}</a>
    //  <br/><br/>
    //</> : ''}

  // <b>{t('Image')}</b><br/>
  // <ImageSelector record={user} field="image_slug" variant="original" maxSizeBytes={2*1000*1000} suggestions={suggestions} height="180px" defaultImage="/icons/person-fill.svg" />

  const [name, nameField] = withInputField(user.name, {size: 8, className: 'editable-input', onBlur: changeName})

  function changeName() { 
    ajax({url: '/rename_user', method: 'POST', data: {name}})
  }

  // <button type="button" className="float-end btn btn-danger" onClick={destroyUser}>{t('Delete')}</button>
  return <>
    <h1>{t('Edit_profile')}</h1>
    <b>{t('Name')}</b><br/>
    {nameField}<br/><br/>
    <b>{t('Language')}</b><br/>
    <CollectionSelect model={user} field="locale" options={['en', 'fr']} showOption={e => e} includeBlank={false}/><br/><br/>
    <a href="/" className="btn btn-primary">{t('Ok')}</a>
  </>
}

document.addEventListener('DOMContentLoaded', () => {

  const root = document.getElementById('root')
  ReactDOM.render(<UserEditor/>, root)
  //const root = createRoot(document.getElementById("root"));
  //root.render(<UserEditor/>);
})
