import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import Autosuggest from 'react-autosuggest'
import {Block, Inline, InlineBlock, Row, Col, InlineRow, InlineCol, Grid} from 'jsxstyle'

import { RecipeTiptap, BubbleTiptap } from './tiptap'
import { LinkToPage, parseIngredientsAndHeaders } from "./lib"
import { Utils } from "./recipe_utils"
import { RecipeMediumImage } from "./image"

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
        let prettyQty = Utils.prettyQuantityFor(qty, machineFoodName)
        return <li key={n} className="list-group-item">
          <span>{prettyQty} <span className="food-name">{machineFoodName}</span></span>
        </li>
      }
    })}
  </>
}

export const RecipeViewer = ({recipeId, page, userRecipes, favoriteRecipes, machines, mixes, machineFoods, foods, recipeKinds, images, user, users, recipes, suggestions, tags}) => {

  const recipe = recipes.find(e => e.id == recipeId)
  useEffect(() => {
    let r = recipes.find(e => e.id == recipeId)
    if (!r) {
      window.hcu.fetchRecord('recipes', recipeId)
    }
  }, [recipeId])
  if (!recipe) {return ''}

  const noteIds = recipe.notes ? Object.values(recipe.notes).sort((a,b) => a.item_nb - b.item_nb).map(ing => ing.id) : []
  const ingredientsAndHeaders = parseIngredientsAndHeaders(recipe.ingredients)
  const ingredients = ingredientsAndHeaders.filter(e => e.label || e.qty)
  console.log('ingredients', ingredients)
  const toolIds = []
  const mix = mixes.find(m => m.recipe_id == recipe.id)
  const recipeTags = suggestions.filter(s => s.recipe_id == recipe.id).map(s => tags.find(t => t.id == s.filter_id))
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
            let prettyQty = Utils.prettyQuantityFor(ing.qty, ing.label)
            return <li key={ing.key} className="list-group-item">
              <span>{prettyQty} <span className="food-name">{ing.label}</span></span>
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

  const recipeUser = users.find(u => u.id == recipe.user_id)
  const userName = recipeUser ? recipeUser.name : `user${recipe.user_id}`

  return (<>
    <div style={{fontSize: '0.8em', marginBottom: '0.5em'}}>
      <b>Tags:</b>&nbsp;
      <span>
        {!recipeTags || recipeTags.length == 0 ? 'Aucun' : recipeTags.map(tag => 
          <LinkToPage key={tag.id} page={{page: 9, filterId: tag.id}} className="plain-link h002">#{tag.name}&nbsp;</LinkToPage>
        )}
      </span>
    </div>
    <div className="recipe">
      <div className="d-block d-md-flex gap-20">
        <div>
          <RecipeMediumImage {...{recipe, recipeKinds, images, showCredit: true}} />
        </div>
        <div style={{width: '100%'}}>
          <h1>
            <span className="recipe-title">{recipe.name}</span>
            {user.id != recipe.user_id ? '' :
              <span className="dropdown" style={{padding: "0 1rem"}}>
                <img className="clickable" data-bs-toggle="dropdown" src="/icons/list.svg"/>
                <div className="dropdown-menu">
                  <LinkToPage page={{...page, page: 16}} className="dropdown-item">Modifier</LinkToPage>
                </div>
              </span>
            }
          </h1>
          <div style={{marginTop: '-0.8em', marginBottom: '1.2em'}}>
            <span style={{color: 'gray'}}>par {userName}</span>
          </div>
          <div>
            <b>Préparation (minutes): </b>
            <span style={{color: 'gray'}}>{recipe.preparation_time}</span>
          </div>
          <div>
            <b>Cuisson (minutes): </b>
            <span style={{color: 'gray'}}>{recipe.cooking_time}</span>
          </div>
          <div>
            <b>Total (minutes): </b>
            <span style={{color: 'gray'}}>{recipe.total_time}</span>
          </div>
          <div>
            <b>Portions: </b>
            <span style={{color: 'gray'}}>{recipe.raw_servings}</span>
          </div>
          <div className="d-flex" style={{gap: '5px', marginTop: '10px'}}>
            <a className="btn btn-outline-secondary" href="FIXME">
              <img src="/icons/printer.svg" width="16"></img>
            </a>
            <a className="btn btn-outline-secondary" href="FIXME">
              <img src="/icons/share.svg" width="16"></img>
            </a>
            <a className="btn btn-outline-secondary" href="FIXME">
              <img src="/icons/download.svg" width="16"></img>
            </a>
            {function() {
              let img = favorite ? "/icons/star-fill.svg" : "/icons/star.svg"
              const handleClick = () => {
                if (favorite) {
                  window.hcu.destroyRecord(favorite)
                } else {
                  window.hcu.createRecord({table_name: "favorite_recipes", recipe_id: recipe.id})
                }
              }
              return <button type="button" className="btn btn-outline-secondary" onClick={handleClick}>
                <img src={img} width="16"></img>
              </button>
            }()}
          </div>
        </div>
      </div>
      <div className="recipe-body">

        <h2 style={{flexGrow: '1'}}>Ingrédients</h2>
        {IngredientList}
      
        <h2>Instructions</h2>
        <RecipeTiptap recipe={recipe} editable={false} />
      </div>
      <br/><br/><br/><br/><br/><br/><br/><br/>
    </div>
  </>)
}

export default RecipeViewer;
