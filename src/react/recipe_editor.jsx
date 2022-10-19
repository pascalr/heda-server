import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Autosuggest from 'react-autosuggest'

import { ajax } from "./utils"
import { DeleteConfirmButton } from './components/delete_confirm_button'
import { RecipeTiptap, BubbleTiptap } from './tiptap'
import {AutocompleteInput, updateRecord, TextField, CollectionSelect, TextAreaField} from './form'
import { parseIngredientsAndHeaders, parseIngredientsOldFormat, serializeIngredientsAndHeaders } from './lib'
import {EditRecipeImageModal} from './modals/recipe_image'
import {PasteIngredientsButton} from './modals/paste_ingredients'
import {EditMix} from './app'
import { RecipeMediumImage } from "./image"
import { RecipeUtils } from "./recipe_utils"
import { t } from "../translate"

const InstructionsShortcuts = props => (
  <>
    <button type="button" className="btn btn-small dropdown-toggle" data-bs-toggle="collapse" data-bs-target="#show-shortcuts">
      Voir les racourcis claviers
    </button>
    <div className="collapse" id="show-shortcuts">
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
        <li><b>{"{3;}"}</b>: TODO: Afficher le nombre 3 qui scale avec la recette</li>
        <li><b>{"{3;pomme}"}</b>: TODO: Afficher la quantité 3 pomme qui scale avec la recette</li>
        <li><b>{"{2;pomme,3-5}"}</b>: TODO: Afficher la quantité 3 pomme qui scale avec la recette et les ingrédients 3, 4 et 5.</li>
        <li><b>[1]</b>: TODO: Lien vers la note 1</li>
        <li><b>[1;Section name]</b>: TODO: Lien vers la section de l'article</li>
        <li><b>[note: 1]</b></li>
        <li><b>[link_note: 1]</b></li>
        <li><b>[recipe: 100]</b></li>
        <li><b>[food: 100]</b></li>
        <li><b>[url: "http://www.hedacuisine.com/"]</b></li>
        <li><b>[label: "home", url: "http://www.hedacuisine.com/"]</b></li>
        <li><b>[img: 10]</b></li>
      </ul>
    </div>
  </>
)

const NewIngredient = ({foods, updateIngredients, addIngredient}) => {
  
  const [qty, setQty] = useState('')
  const [label, setLabel] = useState('')

  const qtyInputField = useRef(null);

  function handleSubmit(e) {
    e.preventDefault()
    addIngredient(qty, label)
    setQty('')
    setLabel('')
    qtyInputField.current.focus()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="d-flex align-items-center" style={{gap: '5px'}}>
        <input type="text" size="8" className="editable-input" value={qty||''} name="qty" onChange={(e) => setQty(e.target.value)} style={{marginLeft: '1.65rem'}} ref={qtyInputField} />
        de{/*" de " ou bien " - " si la quantité n'a pas d'unité => _1_____ - oeuf*/}
        <input type="text" size="24" value={label||''} name="label" onChange={(e) => setLabel(e.target.value)} />
        <button type="submit" className="btn btn-sm btn-primary">Ajouter</button>
      </div>
    </form>
  )
}

const EditableIngredient = ({recipe, ingredient, itemNb, foods, mixes, updateIngredients, removeIngredientOrHeader}) => {
  
  const [qty, setQty] = useState(ingredient.qty)
  const [label, setLabel] = useState(ingredient.label)

  let mix = mixes.find(e => e.recipe_id == recipe.id)

  let moveIngToMix = () => {
    //let ins = mix.instructions+';ADD,'+ingredient.raw+','+(f ? f.name : ingredient.name)
    //ajax({url: mix_path(mix), type: 'PATCH', data: {mix: {instructions: ins}}, success: (mix) => {
    //  mixes.update(mixes.map(e => e.id == mix.id ? mix : e))
    //  removeIngredient()
    //}})
  }

  let preposition = RecipeUtils.needsPreposition(qty) ? RecipeUtils.prettyPreposition(label) : ''
  return (
    <div className="d-flex align-items-center" style={{gap: '5px'}}>
      <span style={{padding: "0 10px 0 0"}}><b>{itemNb}.</b></span>
      <input type="text" size="8" className="editable-input" value={qty||''} name="qty" onChange={(e) => setQty(e.target.value)} onBlur={(e) => {ingredient.qty = qty; updateIngredients()}} />
      <div style={{width: '1em'}}>{preposition}</div>
      <input className="food-name" type="text" size="24" value={label||''} name="label" onChange={(e) => setLabel(e.target.value)} onBlur={(e) => {ingredient.label = label; updateIngredients()}} style={{border: '1px solid #ccc'}} />
      <div className='flex-grow-1' />
      {mix ? <img className="clickable" style={{marginRight: '0.4em'}} src="/icons/arrow-down-up.svg" width="16" height="16" onClick={moveIngToMix}></img> : '' }
      <DeleteConfirmButton id={`ing-${ingredient.key}`} onDeleteConfirm={() => removeIngredientOrHeader(itemNb-1)} message="Je veux enlever cet ingrédient?" />
    </div>
  )
}

const EditableIngredientSection = ({item, index, updateIngredients, removeIngredientOrHeader}) => {

  const [header, setHeader] = useState(item.header)
                
  return <h3 style={{margin: "0", padding: "0.5em 0 0.2em 0"}}>
    <input type="text" size="24" className="plain-input" value={header||''} name="header" onChange={(e) => setHeader(e.target.value)} onBlur={(e) => {item.header = header; updateIngredients()}} />
    <span style={{margin: "0 0.2em"}}>
      <DeleteConfirmButton id={`del-${index}`} onDeleteConfirm={() => removeIngredientOrHeader(index)} message="Je veux enlever ce titre?" />
    </span>
  </h3>
}

export const RecipeEditor = ({recipe, page, machines, mixes, machineFoods, foods, recipeKinds, images, editable, user}) => {

  const [showImageModal, setShowImageModal] = useState(false)

  const [orderedIngredients, setOrderedIngredients] = useState(recipe.ingredients)
  useEffect(() => {
    setOrderedIngredients(recipe.ingredients)
  }, [recipe])

  if (!recipe || recipe.user_id != user.id) {return '';}

  const ingredientsAndHeaders = parseIngredientsAndHeaders(orderedIngredients)
  const ingredients = ingredientsAndHeaders.filter(e => e.label != null || e.qty != null)
  const mix = mixes.find(m => m.recipe_id == recipe.id)

  function handleDrop(droppedItem) {
  
    // Ignore drop outside droppable container
    if (!droppedItem.destination) return;
  
    let source = droppedItem.source.index
    let destination = droppedItem.destination.index
    console.log("source", source)
    console.log("destination", destination)
  
    var updatedList = [...ingredientsAndHeaders];
    const [reorderedItem] = updatedList.splice(source, 1);
    updatedList.splice(destination, 0, reorderedItem);
    let ings = serializeIngredientsAndHeaders(updatedList)
    window.hcu.updateField(recipe, 'ingredients', ings)
    setOrderedIngredients(ings)
  }

  function updateIngredients() {
    window.hcu.updateField(recipe, 'ingredients', serializeIngredientsAndHeaders(ingredientsAndHeaders))
  }

  function removeIngredientOrHeader(index) {
    ingredientsAndHeaders.splice(index, 1)
    window.hcu.updateField(recipe, 'ingredients', serializeIngredientsAndHeaders(ingredientsAndHeaders))
  }

  function addIngredient(qty, label) {
    let key = `${ingredientsAndHeaders.length}-${qty}; ${label}`
    ingredientsAndHeaders.push({key, qty, label})
    window.hcu.updateField(recipe, 'ingredients', serializeIngredientsAndHeaders(ingredientsAndHeaders))
  }

  function addIngredientSection() {
    ingredientsAndHeaders.push({key: `${ingredientsAndHeaders.length}-`, header: ''})
    window.hcu.updateField(recipe, 'ingredients', serializeIngredientsAndHeaders(ingredientsAndHeaders))
  }

  let itemNb = 0
  const renderedIngItems = ingredientsAndHeaders.map((ingOrHeader, i) => {
    return <Draggable key={ingOrHeader.key} draggableId={'drag-'+i} index={i}>
      {(provided) => (
        <div className="item-container" ref={provided.innerRef} {...provided.dragHandleProps} {...provided.draggableProps}>
          {function() {
            if (ingOrHeader.qty != null || ingOrHeader.label != null) {
              const ing = ingOrHeader
              itemNb += 1
              return <li className="list-group-item">
                {<EditableIngredient ingredient={ingOrHeader} {...{recipe, itemNb, mixes, foods, updateIngredients, removeIngredientOrHeader}} />}
              </li>
            } else {
              return <EditableIngredientSection item={ingOrHeader} index={i} {...{updateIngredients, removeIngredientOrHeader}} />
            }
          }()}
        </div>
      )}
    </Draggable>
  })

  const IngredientList = 
    <ul className="list-group" style={{maxWidth: "800px"}}>
      <DragDropContext onDragEnd={handleDrop}>
        <Droppable droppableId="list-container">
          {(provided) => (
            <div className="list-container" {...provided.droppableProps} ref={provided.innerRef}>
              {renderedIngItems}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <li className="list-group-item">
        <NewIngredient {...{foods, updateIngredients, addIngredient}} />
      </li>
    </ul>

  //const NoteList = this.state.noteIds.map(id => {
  //const NoteList = [].map(id => {
  //  const note = recipe.notes[id]

  //  const removeNote = (evt) => {
  //    ajax({url: recipe_recipe_note_path(recipe, note), type: 'DELETE', success: () => {
  //      let ids = this.state.noteIds.filter(item => item != note.id)
  //      this.setState({noteIds: ids})
  //      delete recipe.notes[note.id]
  //    }})
  //  }

  //  return (
  //    <Row key={id} gap="5px" marginBottom="5px">
  //      [{note.item_nb}]
  //      <Block flexGrow="1">
  //        <BubbleTiptap content={JSON.parse(note.json)} model="recipe_note" json_field="json" html_field="html" url={recipe_recipe_note_path(recipe, note)} />
  //      </Block>
  //      <DeleteConfirmButton id={`note-${note.id}`} onDeleteConfirm={removeNote} message="Je veux enlever cette note?" />
  //    </Row>
  //  )
  //})

  //const Tools = this.state.toolIds.map(id => (
  //const Tools = [].map(id => (
  //  <li key={id}>
  //    {recipe.tools[id].name}
  //  </li>
  //))

  //const createMix = () => {
  //  ajax({url: mixes_path(), type: 'POST', data: {mix: {recipe_id: recipe.id}}, success: (mix) => {
  //    mixes.update([...mixes, mix])
  //  }})
  //}
  //let mixEditor = mix ? <EditMix {...{page, favoriteRecipes, machines, mixes, machineFoods, recipes}} /> : (<>
  //  <p>Vous pouvez ajouter des instructions pour automatiser cette recette.</p>
  //  <button type="button" className="btn btn-primary" onClick={createMix}>Ajouter</button>
  //</>)
  let mixEditor = mix ? <>
    <h2>{t('Commands')}</h2>
    <EditMix {...{page, machines, mixes, machineFoods, recipes}} />
  </> : null

  let changeOwner = (e) => {
    let data = {recipeId: recipe.id, newOwnerId: e.target.id}
    ajax({url: '/change_recipe_owner', type: 'PATCH', data, success: () => {
      window.hcu.changeField(recipe, 'user_id', e.target.id)
    }, error: (errors) => {
      console.log('ERROR AJAX UPDATING...', errors.responseText)
    }})
  }
        
  //<h3>Notes</h3>
  //{NoteList}
  //<button type="button" className="plain-btn" onClick={() => appendNote()}>
  //  <img src="/icons/plus-circle.svg" style={{width: "2.5rem", padding: "0.5rem"}}/>
  //</button>
  //
  //<h2>Outils</h2>
  //<ul style={{fontSize: "1.1rem"}}>
  //  {Tools}
  //</ul>
  //
  //<h2>Informations</h2>
  //<table className="table table-light">
  //  <tbody>
  //    <tr>
  //      <th>Ingrédient principal</th>
  //      <td><CollectionSelect model={recipe} field="main_ingredient_id" options={ingredients.map(i => i.id)} showOption={(ingId) => ingredients.filter(i => i.id == ingId).name} includeBlank="true"></CollectionSelect></td>
  //    </tr>
  //  </tbody>
  //</table>
  //<h2>Références</h2>
          
  //const recipeUser = users.find(u => u.id == recipe.user_id)
  //const userName = recipeUser ? recipeUser.name : `user${recipe.user_id}`
  //<div style={{marginTop: '-0.8em', marginBottom: '1.2em', color: 'gray'}}>
  //  <div className="dropdown dropdown-toggle clickable" style={{padding: "0 1em"}}>
  //    <span data-bs-toggle="dropdown">par {userName}</span>
  //    <div className="dropdown-menu">
  //      {users.filter(u => u.id != recipe.user_id).map(usr => {
  //        return <a key={usr.id} id={usr.id} className="dropdown-item clickable" onClick={changeOwner}>{usr.name}</a>
  //      })}
  //    </div>
  //  </div>
  //</div>

  return (<>
    <div className="recipe">
      <div className="d-block d-md-flex">
        <div>
          <div className="over-container">
            <EditRecipeImageModal {...{recipe, recipeKinds, images}} show={showImageModal}
                                   handleClose={() => setShowImageModal(false)} />
            <div style={{cursor: "pointer"}} onClick={() => setShowImageModal(true)}>
              <RecipeMediumImage {...{recipe, recipeKinds, images}} />
              <div className="bottom-right" style={{color: 'white', fontSize: '2em'}}>
                <img src="/icons/pencil-circle.svg" style={{width: "5rem", padding: "0.5rem"}}/>
              </div>
            </div>
          </div> 
        </div>
        <div style={{height: '20px', minWidth: '20px'}}></div>
        <div style={{width: '100%'}}>
          <h1>
            <span className="recipe-title">
              <TextAreaField model={recipe} inputStyle={{width: '100%', lineHeight: '1em'}} field="name" className="plain-input" />
            </span>
          </h1>
          <div>
            <b>{t('Preparation')} ({t('min')}): </b>
            <span style={{color: 'gray'}}>
              <TextField model={recipe} field="preparation_time" className="editable-input" />
            </span>
          </div>
          <div>
            <b>{t('Cooking')} ({t('min')}): </b>
            <span style={{color: 'gray'}}>
              <TextField model={recipe} field="cooking_time" className="editable-input" />
            </span>
          </div>
          <div>
            <b>{t('Total')} ({t('min')}): </b>
            <span style={{color: 'gray'}}>
              <TextField model={recipe} field="total_time" className="editable-input" />
            </span>
          </div>
          <div>
            <b>{t('Servings')}: </b>
            <span style={{color: 'gray'}}>
              <TextField model={recipe} field="raw_servings" className="editable-input" />
            </span>
          </div>
        </div>
      </div>
      <div className="recipe-body">
        {mixEditor}
        <div style={{display: 'flex', alignItems: 'baseline'}}>
          <h2 style={{flexGrow: '1'}}>{t('Ingredients')}</h2>
          <div className="dropstart" style={{padding: "0 1em"}}>
            <img data-bs-toggle="dropdown" style={{cursor: "pointer"}} src="/icons/list.svg"/>
            <div className="dropdown-menu">
              <button className="dropdown-item" type="button" onClick={addIngredientSection}>
                {t('Add_section')}
              </button>
            </div>
          </div>
        </div>
        {IngredientList}
        <PasteIngredientsButton recipe={recipe} />
      
        <h2>{t('Instructions')}</h2>
        <RecipeTiptap recipe={recipe} editable={true} ingredients={ingredients} />
        {editable ? <InstructionsShortcuts/> : ''}
      </div>
      <br/><br/><br/><br/><br/><br/><br/><br/>
    </div>
  </>)
}

