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
  const [account,] = useState(gon.account)
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
    <h1>{t('Edit_account')}</h1>
    <b>{t('Email')}</b><br/>
    {account.email}
    <br/><br/>
    <a href="/" className="btn btn-primary">{t('Ok')}</a>
  </>
}

document.addEventListener('DOMContentLoaded', () => {

  const root = document.getElementById('root')
  ReactDOM.render(<UserEditor/>, root)
  //const root = createRoot(document.getElementById("root"));
  //root.render(<UserEditor/>);
})
