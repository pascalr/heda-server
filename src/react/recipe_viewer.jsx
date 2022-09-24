import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Autosuggest from 'react-autosuggest'
import {Block, Inline, InlineBlock, Row, Col, InlineRow, InlineCol, Grid} from 'jsxstyle'

import Quantity from './models/quantity'
import { ajax } from "./utils"
import { DeleteConfirmButton } from './components/delete_confirm_button'
import { Tiptap, BubbleTiptap, ModificationsHandler } from './tiptap'
import {AutocompleteInput, updateRecord, TextField, CollectionSelect} from './form'
import { combineOrderedListWithHeaders } from './lib'
import {EditRecipeImageModal} from './modals/recipe_image'
import {PasteIngredientsButton} from './modals/paste_ingredients'
import {EditMix} from './app'

import {paste_ingredients_recipes_path, recipe_recipe_ingredients_path, recipe_recipe_ingredient_path, food_path, recipe_ingredient_sections_path, recipe_ingredient_section_path, recipe_recipe_notes_path, move_ing_recipe_path, recipe_path, recipe_recipe_note_path, image_variant_path, mixes_path, mix_path } from './routes'


export const RecipeViewer = ({recipe, page, userRecipes, favoriteRecipes, machines, mixes, machineFoods, foods, recipeIngredients, ingredientSections, recipeKinds, images}) => {

  const recipe_kind = recipeKinds.find(k => k.id == recipe.recipe_kind_id)
  const image_used_id = recipe.use_personalised_image ? recipe.image_id : recipe_kind && recipe_kind.image_id
  const image = images.find(i => i.id == image_used_id)
  const noteIds = recipe.notes ? Object.values(recipe.notes).sort((a,b) => a.item_nb - b.item_nb).map(ing => ing.id) : []
  const ingredients = recipeIngredients.filter(e => e.recipe_id == recipe.id) || []
  const ingredient_sections = ingredientSections.filter(e => e.recipe_id == recipe.id) || []
  const toolIds = []

  const IngredientList = 
    <div id="ing_list">
      <ul className="list-group">
        {ingredients.map(ing => {
          return <li key={ing.id} className="list-group-item">
            <span>{ing.raw} de <span className="food-name">{ing.raw_food}</span></span>
            <div className="dropdown d-inline-block float-end">
               <img className="clickable" data-bs-toggle="dropdown" src="/icons/pencil-square.svg"/>
              <div className="dropdown-menu">
                <a className="dropdown-item disabled" href="#">Retirer</a>
              </div>
            </div>
          </li>
        })}
      </ul>
    </div>

  const NoteList = noteIds.map(id => {
    const note = recipe.notes[id]

    const removeNote = (evt) => {
      ajax({url: recipe_recipe_note_path(recipe, note), type: 'DELETE', success: () => {
        let ids = noteIds.filter(item => item != note.id)
        this.setState({noteIds: ids})
        delete recipe.notes[note.id]
      }})
    }

    return (
      <Row key={id} gap="5px" marginBottom="5px">
        [{note.item_nb}]
        <Block flexGrow="1">
          <BubbleTiptap content={JSON.parse(note.json)} model="recipe_note" json_field="json" html_field="html" url={recipe_recipe_note_path(recipe, note)} />
        </Block>
        <DeleteConfirmButton id={`note-${note.id}`} onDeleteConfirm={removeNote} message="Je veux enlever cette note?" />
      </Row>
    )
  })

  const Tools = toolIds.map(id => (
    <li key={id}>
      {recipe.tools[id].name}
    </li>
  ))
  
  const imagePath = image ? image_variant_path(image, 'medium') : "/img/default_recipe_01.png"
  //console.log(model)
  const mix = mixes.find(m => m.recipe_id == recipe.id)

  const createMix = () => {
    ajax({url: mixes_path(), type: 'POST', data: {mix: {recipe_id: recipe.id}}, success: (mix) => {
      mixes.update([...mixes, mix])
    }})
  }
  
  let mixEditor = mix ? <EditMix {...{page, userRecipes, favoriteRecipes, machines, mixes, machineFoods}} /> : (<>
    <p>Vous pouvez ajouter des instructions pour automatiser cette recette.</p>
    <button type="button" className="btn btn-primary" onClick={createMix}>Ajouter</button>
  </>)

  return (<>
    <div className="recipe">
      <div className="d-block d-md-flex gap-20">
        <div>
          <div style={{width: "452px", height: "304px", maxWidth: "100vw"}}>
            <img src={imagePath} width="452" height="304"/>
          </div>
          {!image ? '' : <>
            <div className="text-center">
              <i>Crédit photo: </i><u><a style={{color: 'block', fontSize: '0.95em'}} href={image.source}>{image.author}</a></u>
            </div>
          </>}
        </div>
        <div style={{width: '100%'}}>
          <h1><span className="recipe-title">{recipe.name}</span></h1>
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
            <a className="btn btn-outline-secondary" href="FIXME">
              <img src="/icons/star.svg" width="16"></img>
            </a>
          </div>
        </div>
      </div>
      <div className="recipe-body">
        
        <h2>Commandes</h2>
        {mixEditor}

        <h2 style={{flexGrow: '1'}}>Ingrédients</h2>
        {IngredientList}
      
        <h2>Instructions</h2>
        <Tiptap model="recipe" json_field="json" html_field="html" url={recipe_path(recipe)} content={JSON.parse(recipe.json)} editable={false} />
       
        {noteIds.length <= 0 ? '' : <>
          <h3>Notes</h3>
          {NoteList}
        </>}
        
        <h2>Outils</h2>
        <ul style={{fontSize: "1.1rem"}}>
          {Tools}
        </ul>
        
        <h2>Informations</h2>
        <table className="table table-light">
          <tbody>
            <tr>
              <th>Ingrédient principal</th>
              <td><CollectionSelect model={recipe} field="main_ingredient_id" options={ingredients.map(i => i.id)} showOption={(ingId) => ingredients.filter(i => i.id == ingId).name} includeBlank="true"></CollectionSelect></td>
            </tr>
          </tbody>
        </table>

        <h2>Références</h2>

      </div>
    </div>
  </>)
}

export default RecipeViewer;
