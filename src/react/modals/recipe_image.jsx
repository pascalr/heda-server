import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'

import {clearRecord, asyncUpdateModel, TextField, ImageField, RadioField} from '../form'
import { image_variant_path } from '../routes'
import { isTrue } from "../utils"
import { t } from "../../translate"

export const EditRecipeImageModal = ({recipe, recipeKinds, images, show, handleClose}) => {

  const recipeKind = recipeKinds.find(k => k.id == recipe.recipe_kind_id)
  const recipeImage = recipe.image_id ? images.find(e => e.id == recipe.image_id) : null
  let recipeKindImage = recipeKind && recipeKind.image_id ? images.find(e => e.id == recipeKind.image_id) : null
  
  const image = isTrue(recipe.use_personalised_image) ? recipeImage : recipeKindImage
  const imagePath = image ? image_variant_path(image, 'medium') : "/img/default_recipe_01.png"

  const removeImage = () => {
    if (window.confirm(t('Confirm_delete'))) {
      window.hcu.updateField(recipe, 'image_id', null)
    }
  }
          
  //<ImageSelector record={recipe} field="image_id" maxSizeBytes={2*1000*1000} height="171px" defaultImage="/img/default_recipe_01.png" />
    
  return (<>
    <Modal show={show} onHide={handleClose}>
      <Modal.Dialog>
        <Modal.Body>
          <button style={{float: "right"}} type="button" className="btn-close" onClick={handleClose}></button>
          <h5 className="modal-title">Aperçu</h5>
          <div>
            <div style={{width: "fit-content"}}>
              <img style={{maxWidth: "100vh", height: "auto"}} src={imagePath} width="255" height="171"/>
            </div>
          </div>
          <hr/>
          {!recipeKindImage ?
            <div className="disabled">
              <RadioField model={recipe} field="use_personalised_image" value={'foo'} label="Utiliser l'image de la catégorie de cette recette"/>
              <div style={{height: "0.5em"}}/>
              <div style={{paddingLeft: "2em"}}>
                <p><i>(Aucune catégorie correspondante.)</i></p>
              </div>
            </div>
          :
            <RadioField model={recipe} field="use_personalised_image" value={false} label="Utiliser l'image de la catégorie de cette recette"/>
          }
          <div style={{height: "0.5em"}}/>
          <RadioField model={recipe} field="use_personalised_image" value={true} label="Utiliser une image personnalisée"/>
          {!isTrue(recipe.use_personalised_image) ? '' :
            <div style={{paddingLeft: "2em"}}>
              <div style={{height: "0.5em"}}/>
              <ImageField record={recipe} field="image_id" maxSizeBytes={2*1000*1000} height="171px" />
              {!recipeImage ? '' : <>
                <div style={{height: "0.5em"}}/>
                <RadioField model={recipeImage} field="is_user_author" value={true} label="Je suis l'auteur de cette image" />
                <div style={{height: "0.5em"}}/>
                <RadioField model={recipeImage} field="is_user_author" value={false} label="L'image est sous une license qui permet son usage" />
                <div style={{height: "0.5em"}}/>
                <div className={recipeImage.is_user_author ? 'disabled' : undefined} style={{paddingLeft: "2em"}}>
                  <label htmlFor="author">Author</label>
                  <TextField model={recipeImage} field="author" id="author"/>
                  <div style={{height: "0.5em"}}/>
                  <label htmlFor="source">Source</label>
                  <TextField model={recipeImage} field="source" id="author"/>
                </div>
                <br/>
                <button type="button" className="btn btn-danger" onClick={removeImage}>{t('Delete')}</button>
              </>}
            </div>
          }
        </Modal.Body>
      </Modal.Dialog>
    </Modal>
  </>)
}
