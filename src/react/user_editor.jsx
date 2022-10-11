import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { TextField, RadioField } from './form'
import { initHcu, useHcuState } from "../hcu"
import { ajax } from "./utils"

const UserEditor = () => {

  if (!window.hcu) {initHcu()}
  const users = useHcuState([gon.user], {tableName: 'users'})
  const user = users[0]

  const destroyUser = () => {
    if (confirm('Voulez-vous supprimer définitivement ce profil?')) {
      let url = '/destroy_profile/'+user.id
      ajax({url, type: 'DELETE', success: (status) => {
        window.location.href = "/choose_user"
      }, error: (errors) => {
        console.log('ERROR AJAX DELETE...', errors.responseText)
        toastr.error(errors.responseText)
      }})
    }
  }

  return <>
    <b>Name</b><br/>
    <TextField model={user} field="name" size="8" className="editable-input" /><br/><br/>
    <b>Gender</b><br/>
    <RadioField model={user} field="gender" value={1} label="Homme"/><br/>
    <RadioField model={user} field="gender" value={2} label="Femme"/><br/>
    <RadioField model={user} field="gender" value={3} label="Autre"/><br/>
    <hr/>
    <button type="button" className="float-end btn btn-danger" onClick={destroyUser}>Supprimer</button>
    <a href="/" className="btn btn-primary">Ok</a>
  </>
}

document.addEventListener('DOMContentLoaded', () => {

  const root = document.getElementById('root')
  ReactDOM.render(<UserEditor/>, root)
  //const root = createRoot(document.getElementById("root"));
  //root.render(<UserEditor/>);
})
