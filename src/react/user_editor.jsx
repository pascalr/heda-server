import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { TextField, RadioField, ImageField } from './form'
import { initHcu, useHcuState } from "../hcu"
import { ajax } from "./utils"
import { image_slug_variant_path } from "./routes"

const UserEditor = () => {

  if (!window.hcu) {initHcu()}
  const users = useHcuState([gon.user], {tableName: 'users'})
  const images = useHcuState(gon.images, {tableName: 'images'})
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

  const imageId = (user.image_slug || '').split('.')[0]
  const image = images.find(i => i.id == imageId)
  const imagePath = image ? image_slug_variant_path(user.image_slug, 'medium') : "/icons/person-fill.svg"

  return <>
    <b>Name</b><br/>
    <TextField model={user} field="name" size="8" className="editable-input" /><br/><br/>
    <b>Image</b><br/>
    <div style={{width: "fit-content"}}>
      <img style={{maxWidth: "100vh", height: "auto"}} src={imagePath} width="150" height="150"/>
    </div>
    <ImageField record={user} field="image_slug" image={image} onRemove={() => window.hcu.updateField(user, 'image_slug', null)} maxSizeBytes={2*1000*1000} />
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
