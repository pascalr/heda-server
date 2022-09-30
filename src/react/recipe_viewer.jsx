import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import Autosuggest from 'react-autosuggest'
import {Block, Inline, InlineBlock, Row, Col, InlineRow, InlineCol, Grid} from 'jsxstyle'

import Quantity from './models/quantity'
import { Tiptap, BubbleTiptap } from './tiptap'
import { LinkToPage } from "./lib"
import {image_variant_path, recipe_path} from './routes'
import { Utils } from "./recipe_utils"


export const RecipeViewer = ({recipe, page, userRecipes, favoriteRecipes, machines, mixes, machineFoods, foods, recipeIngredients, ingredientSections, recipeKinds, images, user}) => {

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
          let foodName = ing.raw_food
          let prettyQty = Utils.prettyQuantityFor(ing.raw, foodName)
          //let food = foods.find(food => food.name == foodName)
          return <li key={ing.id} className="list-group-item">
            <span>{prettyQty} <span className="food-name">{ing.raw_food}</span></span>
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
          <h1>
            <span className="recipe-title">{recipe.name}</span>
            {user.id != recipe.user_id ? '' :
              <span className="dropdown" style={{padding: "0 1rem"}}>
                <img className="clickable" data-bs-toggle="dropdown" src="/icons/list.svg"/>
                <div className="dropdown-menu">
                  <LinkToPage page={{...page, page: 16}} className="dropdown-item" active={page.page == 16}>Modifier</LinkToPage>
                </div>
              </span>
            }
          </h1>
          <div style={{marginTop: '-1.2em', marginBottom: '1.2em'}}>
            <span style={{color: 'gray'}}>par user{recipe.user_id}</span>
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
            <a className="btn btn-outline-secondary" href="FIXME">
              <img src="/icons/star.svg" width="16"></img>
            </a>
          </div>
        </div>
      </div>
      <div className="recipe-body">

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
        
        <h2>Références</h2>

      </div>
    </div>
  </>)
}

export default RecipeViewer;
