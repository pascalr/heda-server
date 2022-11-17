import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import Modal from 'react-bootstrap/Modal'

import {clearRecord, ImageSelector, TextField, ImageField, RadioField} from '../form'
import { RecipeMediumImage } from "../image"
import { image_path } from '../routes'
import { isTrue } from "../utils"
import { useOrFetch } from "../lib"
import { t } from "../../translate"

export const EditableImage = ({recipe, images}) => {

  const [showImageModal, setShowImageModal] = useState(false)

  return <div className="over-container">
    <EditRecipeImageModal {...{recipe, images}} show={showImageModal}
                           handleClose={() => setShowImageModal(false)} />
    <div style={{cursor: "pointer"}} onClick={() => setShowImageModal(true)}>
      <RecipeMediumImage {...{recipe, images}} />
      <div className="bottom-right" style={{color: 'white', fontSize: '2em'}}>
        <img src="/icons/pencil-circle.svg" style={{width: "5rem", padding: "0.5rem"}}/>
      </div>
    </div>
  </div> 
}

export const EditRecipeImageModal = ({recipe, images, show, handleClose}) => {

  const image = useOrFetch('images', images, (i) => i.slug == recipe.image_slug, '/fetch_image/'+recipe.image_slug)

  //const image = recipe.image_slug ? images.find(e => e.slug == recipe.image_slug) : null
  const imagePath = recipe.image_slug ? image_path(recipe.image_slug, 'medium') : "/img/default_recipe_01.png"

  const removeImage = () => {
    if (window.confirm(t('Confirm_delete'))) {
      window.hcu.updateField(recipe, 'image_slug', null)
    }
  }
    
  return (<>
    <Modal show={show} onHide={handleClose}>
      <Modal.Dialog>
        <Modal.Body>
          <button style={{float: "right"}} type="button" className="btn-close" onClick={handleClose}></button>
          <h2 className="h003">{t('Choose_an_image')}</h2>
          <ImageSelector record={recipe} field="image_slug" variant="small" maxSizeBytes={6*1000*1000} height="171px" defaultImage="/img/default_recipe_01.png" />
          {!image ? '' : <>
            <div style={{height: "0.5em"}}/>
            <RadioField model={image} field="is_user_author" value={true} label={t('I_am_author')} />
            <div style={{height: "0.5em"}}/>
            <RadioField model={image} field="is_user_author" value={false} label={t('Image_public_license')} />
            <div style={{height: "0.5em"}}/>
            <div className={image.is_user_author ? 'disabled' : undefined} style={{paddingLeft: "2em"}}>
              <label htmlFor="author">{t('Author')}</label>
              <TextField model={image} field="author" id="author"/>
              <div style={{height: "0.5em"}}/>
              <label htmlFor="source">{t('Source')}</label>
              <TextField model={image} field="source" id="author"/>
            </div>
          </>}
          <br/><br/>
          <button className="btn btn-primary" type="button" onClick={handleClose}>{t('Ok')}</button>
        </Modal.Body>
      </Modal.Dialog>
    </Modal>
  </>)
}
