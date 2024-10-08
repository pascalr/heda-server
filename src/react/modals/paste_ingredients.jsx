import React, { useState, useEffect, useRef } from 'react'
import Modal from 'react-bootstrap/Modal'

import {TextAreaField} from '../form'
import { t } from "../../translate"

export const PasteIngredientsButton = (props) => {
  const [showModal, setShowModal] = useState(false)
  return (<>
    <button type="button" className="plain-btn" onClick={() => setShowModal(true)}>
      <img src="/icons/pencil-square.svg" style={{width: "2.5rem", padding: "0.5rem"}}/>
    </button>
    <PasteIngredientsModal show={showModal} handleClose={() => setShowModal(false)} {...props} />
  </>)
}

let example = `  # Pâte à crêpe
  2 t; farine
  4; oeuf
  ; lait
`

const PasteIngredientsModal = ({recipe, show, handleClose}) => {
  return (<>
    <Modal show={show} onHide={handleClose}>
      <Modal.Body>
        <button style={{float: "right"}} type="button" className="btn-close" onClick={handleClose}></button>
        <h5 className="modal-title">{t('Ingredients')}</h5>
        <TextAreaField model={recipe} field='ingredients' placeholder="Par exemple...&#10;1 1/2 t farine tout usage&#10;250 mL d'eau&#10;4 oeufs&#10;" cols={40} rows={15} />
        <button type="button" className="btn btn-outline-primary d-block" onClick={handleClose}>Ok</button>
        <br/>
        <h5>{t('Notes')}</h5>
        <ol>
          <li>{t('n1')}</li>
          <li>{t('n2')}</li>
          <li>{t('n3')}</li>
        </ol>
        <h6>Exemple (crêpes)</h6>
        <pre>{example}</pre>
      </Modal.Body>
    </Modal>
  </>)
}
