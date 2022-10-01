import React, { useState, useEffect, useRef } from 'react'

import {PercentageCompleted} from './helpers/recipes_helper'
import { ajax, isBlank, normalizeSearchText } from "./utils"
import { recipe_path, favorite_recipe_path, favorite_recipes_path, image_variant_path } from "./routes"
import {EditUserRecipeModal} from './modals/edit_user_recipe'
import { DeleteConfirmButton } from './components/delete_confirm_button'
import { LinkToPage } from "./lib"

export const RecipeListItem = ({recipe, current, suggestions, tags, recipeKinds, page, selected}) => {
  let kind = recipe.recipe_kind_id ? recipeKinds.find(k => k.id == recipe.recipe_kind_id) : null
  let image_used_id = recipe.image_id || (kind && kind.image_id)
  let recipeTags = suggestions.filter(suggestion => suggestion.recipe_id == recipe.id).map(suggestion => tags.find(t => t.id == suggestion.filter_id))
  return (
    <li key={recipe.id}>
      <img src={image_used_id ? image_variant_path({id: image_used_id}, "thumb") : "/img/default_recipe_01_thumb.png"} width="71" height="48" style={{marginRight: '0.5em'}} />
      <LinkToPage page={{...page, page: 15, recipeId: recipe.id}} style={{color: 'black', fontSize: '1.1em', textDecoration: 'none'}} className={current == selected ? "selected" : undefined}>{recipe.name}</LinkToPage>
      <span style={{color: 'gray', fontSize: '0.78em'}}>{recipeTags.map(tag => ` #${tag.name}`)} </span>
    </li>
  )
}
  
const updateFavoriteRecipe = (fav, list_id, recipe) => {
  if (fav) {
    window.hcu.updateField(fav, 'list_id', list_id)
  } else if (list_id != 0) {
    window.hcu.createRecord({class_name: "favorite_recipe", list_id: list_id, recipe_id: recipe.id})
  }
}

const removeFavorite = (fav, recipe) => {
  window.hcu.destroyRecord(fav)
  window.hcu.removeRecord(recipe)
}

const RecipeListItemMenu = ({fav, recipe, editUserRecipe}) => {

  let toCook = <button type="button" className="dropdown-item" onClick={() => updateFavoriteRecipe(fav, 1, recipe)}>À cuisiner</button>
  let toTry = <button type="button" className="dropdown-item" onClick={() => updateFavoriteRecipe(fav, 2, recipe)}>À essayer</button>
  let toNotCook = <button type="button" className="dropdown-item" onClick={() => updateFavoriteRecipe(fav, 0, recipe)}>Ne plus cuisiner</button>
  let toNotTry = <button type="button" className="dropdown-item" onClick={() => updateFavoriteRecipe(fav, 0, recipe)}>Ne plus essayer</button>

  return <>
    <span className="dropdown m-auto">
      <button className="plain-btn" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
        <img src="icons/three-dots.svg"/>
      </button>
      <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
        <li>{fav && fav.list_id == 1 ? toNotCook : toCook }</li>
        <li>{fav && fav.list_id == 2 ? toNotTry : toTry }</li>
        <li><button type="button" className="dropdown-item" onClick={() => editUserRecipe(recipe)}>Tagger</button></li>
        {fav ? <li><button type="button" className="dropdown-item" onClick={() => removeFavorite(fav, recipe)}>Retirer de mes favoris</button></li> : ''}
      </ul>
    </span>
  </>
}

export const RecipeList = ({page, list, original, selected, suggestions, tags, editUserRecipe, mixes, recipes, recipeKinds}) => {

  //{!showPercentCompleted ? '' : <span>&nbsp;(<PercentageCompleted recipe={recipe}/>)</span>}
  return (<>
    <ul id="recipes" className="recipe-list">
      {list.map((item, current) => {
        let recipe = item.recipe
        let fav = item.fav
        let kind = recipe.recipe_kind_id ? recipeKinds.find(k => k.id == recipe.recipe_kind_id) : null
        let image_used_id = recipe.image_id || (kind && kind.image_id)
        let recipeTags = suggestions.filter(suggestion => suggestion.recipe_id == recipe.id).map(suggestion => tags.find(t => t.id == suggestion.filter_id))
        let mix = mixes.find(e => e.recipe_id == recipe.id)

        return (
          <li key={recipe.id} className='d-flex'>
            <span>
              <LinkToPage page={{...page, page: 15, recipeId: recipe.id}} style={{color: 'black', fontSize: '1.1em', textDecoration: 'none'}} className={current == selected ? "selected" : undefined}>
                <img src={image_used_id ? image_variant_path({id: image_used_id}, "thumb") : "/img/default_recipe_01_thumb.png"} width="71" height="48" style={{marginRight: '0.5em'}} />
                {recipe.name}
              </LinkToPage>
              {mix ? <img src="/img/logo_001.svg" width="24" height="24"/> : ''}
              <span style={{color: 'gray', fontSize: '0.78em'}}>{recipeTags.map(tag => ` #${tag.name}`)} </span>
            </span>
            <span className="flex-grow-1"/>
            <RecipeListItemMenu {...{fav, recipe, editUserRecipe}} />
          </li>
        )
      })}
    </ul>
  </>)
}

export const RecipeIndex = ({page, favoriteRecipes, suggestions, tags, mixes, recipes, recipeKinds}) => {
  
  const [showModal, setShowModal] = useState(true)
  const [recipeToEdit, setRecipeToEdit] = useState(null)
 
  let ids = favoriteRecipes.map(f => f.recipe_id)
  let filteredUserRecipes = []
  let toCookList = []
  let toTryList = []
  let otherList = []

  recipes.forEach((recipe) => {
    f = favoriteRecipes.find(r => r.recipe_id == recipe.id)
    if (!f) { filteredUserRecipes.push({recipe: recipe, fav: f}) }
    else if (f.list_id == 1) { toCookList.push({recipe: recipe, fav: f}) }
    else if (f.list_id == 2) { toTryList.push({recipe: recipe, fav: f}) }
    else { otherList.push({recipe: recipe, fav: f}) }
  })
  let all = [...recipes, ...toCookList, ...toTryList, ...otherList]

  let editUserRecipe = (recipe) => {
    setRecipeToEdit(recipe)
    setShowModal(true)
  }

  let listArgs = {page, suggestions, tags, editUserRecipe, mixes, recipes, recipeKinds}

  return (<>
    <EditUserRecipeModal showModal={showModal} setShowModal={setShowModal} recipe={recipeToEdit} tags={tags} suggestions={suggestions} />
    <h3>À cuisinner prochainement</h3>
    <RecipeList original={recipes} list={toCookList} {...listArgs} />
    <h3>À essayer</h3>
    <RecipeList original={recipes} list={toTryList} {...listArgs} />
    <h3>Mes recettes personnelles</h3>
    <RecipeList original={recipes} list={filteredUserRecipes} {...listArgs} />
    <h3>Mes recettes favorites</h3>
    <RecipeList original={recipes} list={otherList} {...listArgs} />
  </>)
}
