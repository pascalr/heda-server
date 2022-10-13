import React, { useState, useEffect, useRef } from 'react'

import { ajax, isBlank, normalizeSearchText } from "./utils"
import { image_variant_path } from "./routes"
import { EditTagsModal } from './modals/edit_tags'
import { DeleteConfirmButton } from './components/delete_confirm_button'
import { LinkToPage } from "./lib"
import { RecipeThumbnailImage } from "./image"
import { t } from "../translate"
  
const updateFavoriteRecipe = (fav, list_id, recipe, user) => {
  if (fav && recipe.user_id == user.id) {
    window.hcu.destroyRecord(fav)
  } else if (fav) {
    window.hcu.updateField(fav, 'list_id', list_id)
  } else if (list_id != 0) {
    window.hcu.createRecord({table_name: "favorite_recipes", list_id: list_id, recipe_id: recipe.id})
  }
}

export const removeRecipe = (recipe) => {
  if (confirm("Voulez vous supprimez définitivement cette recette?")) {
    window.hcu.destroyRecord(recipe)
  }
}

const removeFavoriteRecipe = (fav, recipe) => {
  window.hcu.destroyRecord(fav)
  window.hcu.removeRecord(recipe)
}

const RecipeListItemMenu = ({fav, recipe, editUserRecipe, user}) => {

  let toCook = <button type="button" className="dropdown-item" onClick={() => updateFavoriteRecipe(fav, 1, recipe, user)}>À cuisiner</button>
  let toTry = <button type="button" className="dropdown-item" onClick={() => updateFavoriteRecipe(fav, 2, recipe, user)}>À essayer</button>
  let toNotCook = <button type="button" className="dropdown-item" onClick={() => updateFavoriteRecipe(fav, 0, recipe, user)}>Ne plus cuisiner</button>
  let toNotTry = <button type="button" className="dropdown-item" onClick={() => updateFavoriteRecipe(fav, 0, recipe, user)}>Ne plus essayer</button>

  return <>
    <span className="dropdown m-auto">
      <button className="plain-btn" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
        <img src="icons/three-dots.svg"/>
      </button>
      <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
        <li>{fav && fav.list_id == 1 ? toNotCook : toCook }</li>
        <li>{fav && fav.list_id == 2 ? toNotTry : toTry }</li>
        <li><button type="button" className="dropdown-item" onClick={() => editUserRecipe(recipe)}>Tagger</button></li>
        {fav ? <li><button type="button" className="dropdown-item" onClick={() => removeFavoriteRecipe(fav, recipe)}>Retirer de mes favoris</button></li> : ''}
        {recipe.user_id == user.id ? <li><button type="button" className="dropdown-item" onClick={() => {removeRecipe(recipe)}}>Supprimer la recette</button></li> : ''}
      </ul>
    </span>
  </>
}

export const RecipeList = ({page, list, selected, suggestions, tags, editUserRecipe, mixes, recipes, recipeKinds, user, images}) => {

  return (<>
    <ul id="recipes" className="recipe-list">
      {list.map((item, current) => {
        let {fav, recipe} = item
        let recipeTags = suggestions.filter(suggestion => suggestion.recipe_id == recipe.id).map(suggestion => tags.find(t => t.id == suggestion.tag_id))
        let mix = mixes.find(e => e.recipe_id == recipe.id)

        return (
          <li key={recipe.id} className='d-flex align-items-center'>
            <LinkToPage page={{...page, page: 15, recipeId: recipe.id}} style={{color: 'black', fontSize: '1.1em', textDecoration: 'none'}} className={current == selected ? "selected" : undefined}>
              <div className="d-flex align-items-center">
                <RecipeThumbnailImage {...{recipe, recipeKinds, images}} />
                <div style={{marginRight: '0.5em'}}></div>
                {recipe.name}
              </div>
            </LinkToPage>
              {mix ? <img src="/img/logo_001.svg" width="24" height="24"/> : ''}
            <span className='ms-2' style={{color: 'gray', fontSize: '0.78em', flexShrink: '3'}}>{recipeTags.map(tag => ` #${tag.name}`)} </span>
            <span className="flex-grow-1"/>
            <RecipeListItemMenu {...{fav, recipe, editUserRecipe, user}} />
          </li>
        )
      })}
    </ul>
  </>)
}

export const RecipeIndex = ({page, favoriteRecipes, suggestions, tags, mixes, recipes, recipeKinds, user, images}) => {
  
  const [recipeToEdit, setRecipeToEdit] = useState(null)
  const [showModal, setShowModal] = useState(true)
 
  let userRecipes = []
  let toCookList = []
  let toTryList = []
  let otherList = []

  recipes.forEach((recipe) => {
    f = favoriteRecipes.find(r => r.recipe_id == recipe.id)
    if (!f) { userRecipes.push({recipe: recipe, fav: f}) }
    else if (f.list_id == 1) { toCookList.push({recipe: recipe, fav: f}) }
    else if (f.list_id == 2) { toTryList.push({recipe: recipe, fav: f}) }
    else { otherList.push({recipe: recipe, fav: f}) }
  })

  let editUserRecipe = (recipe) => {
    setRecipeToEdit(recipe)
    setShowModal(true)
  }

  let listArgs = {page, suggestions, tags, editUserRecipe, mixes, recipes, recipeKinds, user, images}

  return (<>
    <EditTagsModal {...{recipe: recipeToEdit, tags, suggestions, showModal, setShowModal}} />
    <br/>
    {toCookList.length == 0 ? null : <>
      <h3 className="h001">{t('To_cook_soon')}</h3>
      <RecipeList list={toCookList} {...listArgs} />
    </>}
    {toTryList.length == 0 ? null : <>
      <h3 className="h001">{t('To_try')}</h3>
      <RecipeList list={toTryList} {...listArgs} />
    </>}
    <h3 className="h001">{t('Personal_recipes')}</h3>
    {userRecipes.length == 0 ? <p>Aucune recette pour l'instant.</p> : <RecipeList list={userRecipes} {...listArgs} />}
    {otherList.length == 0 ? null : <>
      <h3 className="h001">{t('Favorite_recipes')}</h3>
      <RecipeList list={otherList} {...listArgs} />
    </>}
  </>)
}
