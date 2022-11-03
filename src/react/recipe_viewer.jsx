import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'

import { ajax, changeUrl } from "./utils"
import { RecipeTiptap, BubbleTiptap } from './tiptap'
import { Link } from "./lib"
import { parseIngredientsAndHeaders, quantityWithPreposition, prettyPreposition } from "../lib"
import { RecipeMediumImage } from "./image"
import { EditTagsModal } from './modals/edit_tags'
import { removeRecipe, AddToListMenu } from './recipe_index'
import { t } from "../translate"

const MixIngredients = ({mix}) => {
  if (!mix) {return ''}

  return <>
    {mix.instructions.split(';').map((line,n) => {
      if (line.startsWith('CONTAINER')) {
        let id = line.split(',')[1]
        return <h3 key={n} style={{marginTop: '0.8em', marginBottom: '0.2em'}}>{isNaN(id) ? id : 'Contenant '+id}</h3>
      } else if (line.startsWith('ADD')) {
        let args = line.split(',')
        let qty = args[1]
        let i = args[2].indexOf('-')
        let machineFoodId = i ? args[2].substr(0, i) : null
        let machineFoodName = i ? args[2].substr(i+1) : args[2]
        let prettyQty = quantityWithPreposition(qty, machineFoodName, window.locale)
        return <li key={n} className="list-group-item">
          <span>{prettyQty} <span className="food-name">{machineFoodName}</span></span>
        </li>
      }
    })}
  </>
}

export const RecipeViewer = ({recipeId, page, favoriteRecipes, mixes, recipeKinds, images, user, users, recipes, suggestions, tags}) => {

  const [showModal, setShowModal] = useState(false)
  useEffect(() => {
    let r = recipes.find(e => e.id == recipeId)
    if (!r) {
      window.hcu.fetchRecord('recipes', recipeId)
    }
  }, [recipeId])
  
  const recipe = recipes.find(e => e.id == recipeId)
  if (!recipe) {return ''}

  const noteIds = recipe.notes ? Object.values(recipe.notes).sort((a,b) => a.item_nb - b.item_nb).map(ing => ing.id) : []
  const ingredientsAndHeaders = parseIngredientsAndHeaders(recipe.ingredients)
  const ingredients = ingredientsAndHeaders.filter(e => e.label || e.qty)
  const toolIds = []
  const mix = mixes.find(m => m.recipe_id == recipe.id)
  const recipeTags = suggestions.filter(s => s.recipe_id == recipe.id).map(s => tags.find(t => t.id == s.tag_id))
  const favorite = favoriteRecipes.find(f => f.recipe_id == recipe.id)

  const IngredientList = 
    <div id="ing_list">
      <ul className="list-group">
        {ingredientsAndHeaders.map((ingOrHeader,i) => {
          if (ingOrHeader.qty == null && ingOrHeader.label == null) {
            return <h3 key={ingOrHeader.key} style={{margin: "0", padding: "0.5em 0 0.2em 0"}}>
              {ingOrHeader.header}
            </h3>
          } else {
            const ing = ingOrHeader
            let preposition = prettyPreposition(ing.qty, ing.label, window.locale)
            return <li key={ing.key} className="list-group-item">
              <span>{ing.qty} {preposition}<span className="food-name">{ing.label}</span></span>
              <div className="dropdown d-inline-block float-end">
                 <img className="clickable" data-bs-toggle="dropdown" src="/icons/pencil-square.svg"/>
                <div className="dropdown-menu">
                  <a className="dropdown-item disabled" href="#">Retirer</a>
                </div>
              </div>
            </li>
          }
        })}
        <MixIngredients mix={mix} />
      </ul>
    </div>

  //const NoteList = noteIds.map(id => {
  //  const note = recipe.notes[id]

  //  const removeNote = (evt) => {
  //    ajax({url: recipe_recipe_note_path(recipe, note), type: 'DELETE', success: () => {
  //      let ids = noteIds.filter(item => item != note.id)
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

  //const Tools = toolIds.map(id => (
  //  <li key={id}>
  //    {recipe.tools[id].name}
  //  </li>
  //))
  //     
  //{noteIds.length <= 0 ? '' : <>
  //  <h3>Notes</h3>
  //  {NoteList}
  //</>}
  //
  //<h2>Outils</h2>
  //<ul style={{fontSize: "1.1rem"}}>
  //  {Tools}
  //</ul>
  //
  //<h2>Références</h2>

  //console.log(model)
  
  let changeOwner = (e) => {
    let data = {recipeId: recipe.id, newOwnerId: user.id}
    ajax({url: '/change_recipe_owner', type: 'PATCH', data, success: () => {
      window.hcu.changeField(recipe, 'user_id', user.id)
    }, error: (errors) => {
      console.log('ERROR AJAX UPDATING...', errors.responseText)
    }})
  }
  
  const recipeUser = users.find(u => u.id == recipe.user_id)
  const userName = recipeUser ? recipeUser.name : `user${recipe.user_id}`

  const recipeBelongsToSiblings = users.map(u => u.id).filter(id => id != user.id).includes(recipe.user_id)
  const isUser = recipe.user_id == user.id

  return (<>
    <EditTagsModal {...{recipe, tags, suggestions, showModal, setShowModal}} />
    <div className="recipe mt-3">
      <div className="d-block d-md-flex" style={{gap: '20px'}}>
        <div><RecipeMediumImage {...{recipe, images, showCredit: true}} /></div>
        <div style={{height: '20px', width: '0'}}></div>
        <div style={{width: '100%'}}>
          <div className='d-flex'>
            <h1>
              <span className="recipe-title">{recipe.name}</span>
            </h1>
            <div className='flex-grow-1' />
          </div>
          <div style={{marginTop: '-0.8em', marginBottom: '1.2em'}}>
            <span style={{color: 'gray'}}>{t('by')} {userName}</span>
          </div>
          <div>
            <b>{t('Preparation')} ({t('min')}): </b>
            <span style={{color: 'gray'}}>{recipe.preparation_time}</span>
          </div>
          <div>
            <b>{t('Cooking')} ({t('min')}): </b>
            <span style={{color: 'gray'}}>{recipe.cooking_time}</span>
          </div>
          <div>
            <b>{t('Total')} ({t('min')}): </b>
            <span style={{color: 'gray'}}>{recipe.total_time}</span>
          </div>
          <div>
            <b>{t('Servings')}: </b>
            <span style={{color: 'gray'}}>{recipe.raw_servings}</span>
          </div>
          <div className="d-flex" style={{gap: '5px', marginTop: '10px'}}>
            {isUser ?
              <Link path={'/e/'+recipe.id} className="btn btn-outline-secondary">
                <img src="/icons/pencil.svg" width="24"></img>
              </Link>
            : ''}
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(true)}>
              <img src="/icons/tags.svg" width="24"></img>
            </button>
            {function() {
              if (recipe.user_id == user.id) {return ''}
              let img = favorite ? "/icons/star-fill.svg" : "/icons/star.svg"
              const handleClick = () => {
                if (favorite) {
                  window.hcu.destroyRecord(favorite)
                } else {
                  window.hcu.createRecord('favorite_recipes', {recipe_id: recipe.id})
                }
              }
              return <button type="button" className="btn btn-outline-secondary" onClick={handleClick}>
                <img src={img} width="24"></img>
              </button>
            }()}
            <span className="dropdown">
              <a className="btn btn-outline-secondary" href="FIXME" data-bs-toggle="dropdown">
                <img src="/icons/three-dots.svg" width="24"></img>
              </a>
              <div className="dropdown-menu">
                <AddToListMenu {...{fav: favorite, recipe, user}} />
                <hr className="dropdown-divider"/>
                {recipeBelongsToSiblings ? <button type="button" className="dropdown-item" onClick={changeOwner}>{t('Attribute_to_this_profile')}</button> : ''}
                {recipe.user_id == user.id ? <li><button type="button" className="dropdown-item" onClick={() => {removeRecipe(recipe) && changeUrl('/l')}}>{t('Delete_recipe')}</button></li> : ''}
              </div>
            </span>
          </div>
        </div>
      </div>
      <div className="recipe-body">

        <h2 style={{flexGrow: '1'}}>{t('Ingredients')}</h2>
        {IngredientList}
      
        <h2>{t('Instructions')}</h2>
        <RecipeTiptap recipe={recipe} editable={false} />
      </div>
      <br/><br/><br/><br/><br/><br/><br/><br/>
    </div>
  </>)
}

export default RecipeViewer;
