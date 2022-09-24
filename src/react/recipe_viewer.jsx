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

export class RecipeViewer extends React.Component {
  
  constructor(props) {
    super(props);
    let noteIds = gon.recipe.notes ? Object.values(gon.recipe.notes).sort((a,b) => a.item_nb - b.item_nb).map(ing => ing.id) : []
    let recipe_image = gon.recipe.image_id ? gon.images.find(e => e.id == gon.recipe.image_id) : {}
    this.state = {
      recipe: gon.recipe,
      recipe_image: recipe_image,
      name: gon.recipe.name,
      ingredients: gon.recipe_ingredients.filter(e => e.recipe_id == gon.recipe.id) || [],
      noteIds: noteIds,
      ingredient_sections: props.ingredientSections.filter(e => e.recipe_id == gon.recipe.id) || [],
      toolIds: Object.keys(gon.recipe.tools || []),
      instructionsSlave: gon.recipe.complete_instructions,
      showImageModal: false,
    };
  }

  render() {

//const RecipesView = ({page, userRecipes, favoriteRecipes, machines, mixes, machineFoods, foods}) => {
    const {page, userRecipes, favoriteRecipes, machines, mixes, machineFoods, foods} = this.props

    const IngredientList = 
      <div id="ing_list">
        <ul className="list-group">
          {this.state.ingredients.map(ing => {
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

    const NoteList = this.state.noteIds.map(id => {
      const note = gon.recipe.notes[id]

      const removeNote = (evt) => {
        ajax({url: recipe_recipe_note_path(gon.recipe, note), type: 'DELETE', success: () => {
          let ids = this.state.noteIds.filter(item => item != note.id)
          this.setState({noteIds: ids})
          delete gon.recipe.notes[note.id]
        }})
      }

      return (
        <Row key={id} gap="5px" marginBottom="5px">
          [{note.item_nb}]
          <Block flexGrow="1">
            <BubbleTiptap content={JSON.parse(note.json)} model="recipe_note" json_field="json" html_field="html" url={recipe_recipe_note_path(gon.recipe, note)} />
          </Block>
          <DeleteConfirmButton id={`note-${note.id}`} onDeleteConfirm={removeNote} message="Je veux enlever cette note?" />
        </Row>
      )
    })

    const Tools = this.state.toolIds.map(id => (
      <li key={id}>
        {gon.recipe.tools[id].name}
      </li>
    ))

    const recipe = this.state.recipe
    const recipe_kind = gon.recipe_kinds.find(k => k.id == recipe.recipe_kind_id)
    const recipe_image = this.state.recipe_image
    let recipeKindImage = recipe_kind && recipe_kind.image_id ? gon.images.find(e => e.id == recipe_kind.image_id) : null
    const image = recipe.use_personalised_image ? recipe_image : recipeKindImage
    //console.log('use_personalised_image', recipe.use_personalised_image)
    //console.log('recipe kind image', recipeKindImage)
    //console.log('recipe kind', recipe_kind)
    //console.log('recipe image', recipe_image)
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
          <img style={{maxWidth: "100vh", height: "auto"}} src={imagePath} width="452" height="304"/>
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

          <div style={{display: 'flex', alignItems: 'baseline'}}>
            <h2 style={{flexGrow: '1'}}>Ingrédients</h2>
            <div className="dropstart" style={{padding: "0 1em"}}>
              <img data-bs-toggle="dropdown" style={{cursor: "pointer"}} src="/icons/list.svg"/>
              <div className="dropdown-menu">
                <button className="dropdown-item" type="button" onClick={this.appendIngredientSection}>
                  Ajouter une section
                </button>
              </div>
            </div>
          </div>
          {IngredientList}
        
          <h2>Instructions</h2>
          <Tiptap model="recipe" json_field="json" html_field="html" url={recipe_path(gon.recipe)} content={JSON.parse(gon.recipe.json)} editable={false} />
          
          <h3>Notes</h3>
          {NoteList}
          
          <h2>Outils</h2>
          <ul style={{fontSize: "1.1rem"}}>
            {Tools}
          </ul>
          
          <h2>Informations</h2>
          <table className="table table-light">
            <tbody>
              <tr>
                <th>Ingrédient principal</th>
                <td><CollectionSelect model={recipe} field="main_ingredient_id" options={this.state.ingredients.map(i => i.id)} showOption={(ingId) => this.state.ingredients.filter(i => i.id == ingId).name} includeBlank="true"></CollectionSelect></td>
              </tr>
            </tbody>
          </table>

          <h2>Références</h2>

        </div>
      </div>
    </>)
  }
}
