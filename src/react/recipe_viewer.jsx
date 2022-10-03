import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import Autosuggest from 'react-autosuggest'
import {Block, Inline, InlineBlock, Row, Col, InlineRow, InlineCol, Grid} from 'jsxstyle'

import Quantity from './models/quantity'
import { Tiptap, BubbleTiptap } from './tiptap'
import { LinkToPage } from "./lib"
import {image_variant_path, recipe_path} from './routes'
import { Utils } from "./recipe_utils"

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

function parseIngredientsOldFormat(text) {
  return text.split("\n").map((line,i) => {
    if (line.length <= 0) {return null;}
    let args = line.split(";")
    return {item_nb: i+1, raw: args[0].trim(), raw_food: args[1].trim()}
  }).filter(e => e)
}

function parseIngredients(text) {
  return text.split("\n").map(line => {
    if (line.length <= 0) {return null;}
    let args = line.split(";")
    return {qty: args[0].trim(), label: args[1].trim()}
  }).filter(e => e)
}

export const RecipeViewer = ({recipeId, page, userRecipes, favoriteRecipes, machines, mixes, machineFoods, foods, ingredientSections, recipeKinds, images, user, users, recipes}) => {

  let recipe = recipes.find(e => e.id == recipeId)
  gon.recipe = recipe // FIXME: This is really ugly

  useEffect(() => {
    let recipe = recipes.find(e => e.id == recipeId)
    if (!recipe) {
      window.hcu.fetchRecord('recipes', recipeId)
    }
  }, [recipeId])
  if (!recipe) {return ''}

  const recipe_kind = recipeKinds.find(k => k.id == recipe.recipe_kind_id)
  const image_used_id = recipe.use_personalised_image ? recipe.image_id : recipe_kind && recipe_kind.image_id
  const image = images.find(i => i.id == image_used_id)
  const noteIds = recipe.notes ? Object.values(recipe.notes).sort((a,b) => a.item_nb - b.item_nb).map(ing => ing.id) : []
  const ingredients = parseIngredients(recipe.ingredients)
  gon.recipe_ingredients = parseIngredientsOldFormat(recipe.ingredients)
  console.log('ingredients', ingredients)
  const ingredient_sections = ingredientSections.filter(e => e.recipe_id == recipe.id) || []
  const toolIds = []
  const mix = mixes.find(m => m.recipe_id == recipe.id)

  const IngredientList = 
    <div id="ing_list">
      <ul className="list-group">
        {ingredients.map((ing,i) => {
          let prettyQty = Utils.prettyQuantityFor(ing.qty, ing.label)
          return <li key={ing.qty + ';' + ing.label} className="list-group-item">
            <span>{prettyQty} <span className="food-name">{ing.label}</span></span>
            <div className="dropdown d-inline-block float-end">
               <img className="clickable" data-bs-toggle="dropdown" src="/icons/pencil-square.svg"/>
              <div className="dropdown-menu">
                <a className="dropdown-item disabled" href="#">Retirer</a>
              </div>
            </div>
          </li>
        })}
        <MixIngredients mix={mix} />
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

  const recipeUser = users.find(u => u.id == recipe.user_id)
  const userName = recipeUser ? recipeUser.name : `user${recipe.user_id}`

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
