import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'

import {clearRecord, ImageSelector, TextField, ImageField, RadioField} from '../form'
import { image_path } from '../routes'
import { isTrue } from "../utils"
import { t } from "../../translate"

export const EditRecipeImageModal = ({recipe, recipeKinds, images, show, handleClose}) => {

  const image = recipe.image_slug ? images.find(e => e.slug == recipe.image_slug) : null
  const imagePath = image ? image_path(image, 'medium') : "/img/default_recipe_01.png"

  const removeImage = () => {
    if (window.confirm(t('Confirm_delete'))) {
      window.hcu.updateField(recipe, 'image_slug', null)
    }
  }

  console.log('images', images)
  console.log('image', image)
  console.log('imagePath', imagePath)
    
  return (<>
    <Modal show={show} onHide={handleClose}>
      <Modal.Dialog>
        <Modal.Body>
          <button style={{float: "right"}} type="button" className="btn-close" onClick={handleClose}></button>
          <h2 className="h003">Choisir une image</h2>
          <ImageSelector record={recipe} field="image_slug" maxSizeBytes={2*1000*1000} height="171px" defaultImage="/img/default_recipe_01.png" />
          {!image ? '' : <>
            <div style={{height: "0.5em"}}/>
            <RadioField model={image} field="is_user_author" value={true} label="Je suis l'auteur de cette image" />
            <div style={{height: "0.5em"}}/>
            <RadioField model={image} field="is_user_author" value={false} label="L'image est sous une license qui permet son usage" />
            <div style={{height: "0.5em"}}/>
            <div className={image.is_user_author ? 'disabled' : undefined} style={{paddingLeft: "2em"}}>
              <label htmlFor="author">Author</label>
              <TextField model={image} field="author" id="author"/>
              <div style={{height: "0.5em"}}/>
              <label htmlFor="source">Source</label>
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
