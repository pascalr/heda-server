import React, { useState, useEffect, useRef } from 'react'
import Modal from 'react-bootstrap/Modal'

import { Link } from "../lib"
import { t } from "../../translate"

export const EditTagsModal = ({showModal, setShowModal, recipe, tags, suggestions}) => {

  if (recipe == null) {return ''}
  
  let recipeSuggestions = suggestions.filter(s => s.recipe_id == recipe.id)
  let unusedTags = tags.filter(tag => !recipeSuggestions.find(s => s.tag_id == tag.id))

  function addTag(tag) {
    window.hcu.createRecord('suggestions', {tag_id: tag.id, recipe_id: recipe.id})
  }

  function removeSuggestion(suggestion) {
    window.hcu.destroyRecord(suggestion)
  }

  return (<>
    <Modal show={showModal} onHide={() => setShowModal(false)}>
      <Modal.Dialog>
        <Modal.Body>
          <button style={{float: "right"}} type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
          <h5 className="modal-title">{recipe.name}</h5>
          <br/>
          <h6><b>{t('Current_tags')}:</b></h6>
          {recipeSuggestions.map(suggestion => {
            let tag = tags.find(t => t.id == suggestion.tag_id)
            if (!tag) {return console.error('Error suggestion exists but tag missing')}
            return <span key={suggestion.id} className="btn btn-primary m-1" onClick={() => removeSuggestion(suggestion)}>{tag.name} X</span>
          })}
          <br/><br/>
          <h6><b>{t('Add_a_tag')}:</b></h6>
          {unusedTags.map(tag => {
            return <span key={tag.id} className="btn btn-secondary m-1" onClick={() => addTag(tag)}>+ {tag.name}</span>
          })}
          <br/><br/><br/>
          <p className="fs-09"><i>{t('Note_create_tag')} <Link path="/c">{t('parameters')}</Link>.</i></p>
        
        </Modal.Body>
      </Modal.Dialog>
    </Modal>
  </>) }
