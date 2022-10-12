import React, { useState, useEffect, useRef } from 'react'
import Modal from 'react-bootstrap/Modal'

export const EditTagsModal = ({recipe, tags, suggestions}) => {

  const [showModal, setShowModal] = useState(true)
  if (recipe == null) {return ''}
  
  let recipeSuggestions = suggestions.filter(s => s.recipe_id == recipe.id)
  let unusedTags = tags.filter(tag => !recipeSuggestions.find(s => s.tag_id == tag.id))

  function addTag(tag) {
    window.hcu.createRecord({table_name: 'suggestions', tag_id: tag.id, recipe_id: recipe.id})
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
          <h6><b>Tags actuels:</b></h6>
          {recipeSuggestions.map(suggestion => {
            let tag = tags.find(t => t.id == suggestion.tag_id)
            return <span key={suggestion.id} className="btn btn-primary m-1" onClick={() => removeSuggestion(suggestion)}>{tag.name} X</span>
          })}
          <br/><br/>
          <h6><b>Ajouter un tag:</b></h6>
          {unusedTags.map(tag => {
            return <span key={tag.id} className="btn btn-secondary m-1" onClick={() => addTag(tag)}>+ {tag.name}</span>
          })}
          <br/>
        </Modal.Body>
      </Modal.Dialog>
    </Modal>
  </>) }
