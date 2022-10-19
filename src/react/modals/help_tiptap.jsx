import React, { useState, useEffect, useRef } from 'react'
import Modal from 'react-bootstrap/Modal'

//<li><b>{"{3;}"}</b>: TODO: Afficher le nombre 3 qui scale avec la recette</li>
//<li><b>{"{3;pomme}"}</b>: TODO: Afficher la quantité 3 pomme qui scale avec la recette</li>
//<li><b>{"{2;pomme,3-5}"}</b>: TODO: Afficher la quantité 3 pomme qui scale avec la recette et les ingrédients 3, 4 et 5.</li>
//<li><b>[1]</b>: TODO: Lien vers la note 1</li>
//<li><b>[1;Section name]</b>: TODO: Lien vers la section de l'article</li>
//<li><b>[note: 1]</b></li>
//<li><b>[link_note: 1]</b></li>
//<li><b>[recipe: 100]</b></li>
//<li><b>[food: 100]</b></li>
//<li><b>[url: "http://www.hedacuisine.com/"]</b></li>
//<li><b>[label: "home", url: "http://www.hedacuisine.com/"]</b></li>
//<li><b>[img: 10]</b></li>
const InstructionsShortcuts = props => (<>
  <div style={{fontSize: '0.9em'}}>
    <h2>Racourcis claviers</h2>
    <ul>
      <li><b>#</b>: Commencer une ligne avec «#» pour chaque étape de la recette.</li>
      <li><b>$</b>: Commencer une ligne avec «$» pour un grand titre.</li>
      <li><b>$$</b>: Commencer une ligne avec «$$» pour un moyen titre.</li>
      <li><b>$$$</b>: Commencer une ligne avec «$$$» pour un petit titre.</li>
      <li><b>/</b>: Commencer une ligne avec «/» pour faire un paragraph en italique.</li>
      <li><b>{"{3}"}</b>: Afficher l'ingrédient 3</li>
      <li><b>{"{3-5}"}</b>: Afficher les ingrédients 3, 4 et 5</li>
      <li><b>{"{3,5}"}</b>: Afficher les ingrédients 3 et 5</li>
    </ul>
  </div>
</>)

export const HelpTiptapModal = ({showModal, setShowModal}) => {

  return (<>
    <Modal show={showModal} onHide={() => setShowModal(false)}>
      <Modal.Dialog>
        <Modal.Body>
          <button style={{float: "right"}} type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
          <InstructionsShortcuts />
        </Modal.Body>
      </Modal.Dialog>
    </Modal>
  </>) }
