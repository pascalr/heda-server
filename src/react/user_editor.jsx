import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { ToggleField, TextField, RadioField, ImageField, ImageSelector, CollectionSelect } from './form'
import { initHcu, useHcuState } from "../hcu"
import { ajax } from "./utils"
import { image_slug_variant_path } from "./routes"
import { t } from "../translate"

const UserEditor = () => {

  if (!window.hcu) {initHcu()}
  const users = useHcuState([gon.user], {tableName: 'users'})
  const images = useHcuState(gon.images, {tableName: 'images'})
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

  return <>
    <h1>{t('Edit_profile')}</h1>
    <b>{t('Name')}</b><br/>
    <TextField model={user} field="name" size="8" className="editable-input" /><br/><br/>
    <b>{t('Language')}</b><br/>
    <CollectionSelect model={user} field="locale" options={['en', 'fr']} showOption={e => e} includeBlank={false}/><br/><br/>
    <b>{t('Visibility')}</b><br/>
    <ToggleField model={user} field="is_public" labelOn={t('public')} labelOff={t('private')} className="btn btn-primary" /><br/><br/>
    <b>{t('Image')}</b><br/>
    <ImageSelector record={user} field="image_slug" variant="original" maxSizeBytes={2*1000*1000} suggestions={suggestions} height="180px" defaultImage="/icons/person-fill.svg" />
    <hr/>
    <button type="button" className="float-end btn btn-danger" onClick={destroyUser}>{t('Delete')}</button>
    <a href="/" className="btn btn-primary">{t('Ok')}</a>
  </>
}

document.addEventListener('DOMContentLoaded', () => {

  const root = document.getElementById('root')
  ReactDOM.render(<UserEditor/>, root)
  //const root = createRoot(document.getElementById("root"));
  //root.render(<UserEditor/>);
})
