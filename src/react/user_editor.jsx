import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { TextField, RadioField, ImageField, CollectionSelect } from './form'
import { initHcu, useHcuState } from "../hcu"
import { ajax } from "./utils"
import { image_slug_variant_path } from "./routes"
import { UserImage } from './image'
import { t } from "../translate"

const UserEditor = () => {

  if (!window.hcu) {initHcu()}
  const users = useHcuState([gon.user], {tableName: 'users'})
  const images = useHcuState(gon.images, {tableName: 'images'})
  const user = users[0]
  window.locale = user.locale

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

  let suggestionsSlugs = ["125.png", "126.png", "127.png"]

  return <>
    <h1>{t('Edit_profile')}</h1>
    <b>{t('Name')}</b><br/>
    <TextField model={user} field="name" size="8" className="editable-input" /><br/><br/>
    <b>{t('Language')}</b><br/>
    <CollectionSelect model={user} field="locale" options={['en', 'fr']} showOption={e => e} includeBlank={false}/><br/><br/>
    <b>{t('Image')}</b><br/>
    <div className='d-flex align-items-center'>
      <UserImage {...{user, images}} />
      {user.image_slug ? <img className="clickable" src="/icons/x-lg.svg" width="18" height="18" onClick={() => window.hcu.updateField(user, 'image_slug', null)}/> : ''}
    </div>
    <ImageField record={user} field="image_slug" image={image} onRemove={() => window.hcu.updateField(user, 'image_slug', null)} maxSizeBytes={2*1000*1000} />
    {user.image_slug ? '' : <>
      <br/><br/>
      <h6>{t('Image_suggestions')}</h6>
      <div className="d-flex align-items-center">
        {suggestionsSlugs.map(slug => (
          <div key={slug} style={{width: "fit-content"}}>
            <img className="clickable" style={{maxWidth: "100vh", height: "auto"}} src={image_slug_variant_path(slug, "square")} width="80" height="80" onClick={() => window.hcu.updateField(user, 'image_slug', slug)} />
          </div>
        ))}
      </div>
    </>}
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
