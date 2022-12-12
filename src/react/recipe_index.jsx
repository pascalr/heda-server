import React, { useState, useEffect, useRef } from 'react'

import { ajax, normalizeSearchText, changeUrl } from "./utils"
//import { EditTagsModal } from './modals/edit_tags'
import { DeleteConfirmButton } from './components/delete_confirm_button'
import { Link } from "./lib"
import { RecipeThumbnailImage } from "./image"
import { t } from "../translate"
import { handleError } from "../hcu"
  
export const updateFavoriteRecipe = (fav, list_id, recipe, user) => {
  if (fav && recipe.user_id == user.id && list_id == 0) {
    window.hcu.destroyRecord(fav)
  } else if (fav) {
    window.hcu.updateField(fav, 'list_id', list_id)
  } else if (list_id != 0) {
    window.hcu.createRecord('favorite_recipes', {list_id: list_id, recipe_id: recipe.id})
  }
}

export const removeRecipe = (recipe) => {
  if (confirm(t("Confirm_destroy_recipe"))) {
    window.hcu.destroyRecord(recipe)
    return true
  }
  return false
}

const removeFavoriteRecipe = (fav, recipe) => {
  window.hcu.destroyRecord(fav)
  window.hcu.removeRecord(recipe)
}

export const duplicateRecipe = (recipe) => {
  ajax({url: '/duplicate_recipe/'+recipe.id, type: 'POST', success: (dup) => {
    window.hcu.addRecord('recipes', dup)
    changeUrl('/e/'+dup.id)
  }, error: handleError(t('Error_creating'))})
}

export const ChangeVisibilityMenuItem = ({recipe}) => {
  let msg = recipe.is_public ? t('Make_private'): t('Make_public')
  return <button type="button" className="dropdown-item" onClick={() => window.hcu.updateField(recipe, 'is_public', recipe.is_public ? 0 : 1)}>{msg}</button>
}

export const AddToListMenu = ({fav, recipe, user}) => {

  //let inCookList = fav && fav.list_id == 1
  //let inTryList = fav && fav.list_id == 2

  //return <>
  //  <h6 className="dropdown-header">{t('Add_to_list')}</h6>
  //  <button type="button" className="dropdown-item" onClick={() => updateFavoriteRecipe(fav, inCookList ? 0 : 1, recipe, user)}><img src={"/icons/"+(inCookList ? "check-" : '')+"square.svg"} /> {t('To_cook_soon')}</button>
  //  <button type="button" className="dropdown-item" onClick={() => updateFavoriteRecipe(fav, inTryList ? 0 : 2, recipe, user)}><img src={"/icons/"+(inTryList ? "check-" : '')+"square.svg"} /> {t('To_try')}</button>
  //</>
  let inList = fav && fav.list_id == 1

  return <>
    <button type="button" className="dropdown-item" onClick={() => updateFavoriteRecipe(fav, inList ? 0 : 1, recipe, user)}>{inList ? t('Remove_from_my_list') : t('Add_to_my_list')}</button>
  </>
}

const RecipeListItemMenu = ({fav, recipe, user}) => {

        //<button type="button" className="dropdown-item" onClick={() => editUserRecipe(recipe)}>{t('Tag')}</button>
  return <>
    <span className="dropdown m-auto">
      <button className="plain-btn" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
        <img width="24" src="icons/three-dots.svg"/>
      </button>
      <span className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
        {user.id != recipe.user_id ? '' : <Link path={'/e/'+recipe.id} className="dropdown-item">{t('Edit')}</Link>}
        <ChangeVisibilityMenuItem recipe={recipe} />
        <AddToListMenu {...{fav, recipe, user}} />
        <hr className="dropdown-divider"/>
        {recipe.user_id != user.id ? <button type="button" className="dropdown-item" onClick={() => duplicateRecipe(recipe)}>{t('Copy_and_edit')}</button> : ''}
        {recipe.user_id == user.id ? <button type="button" className="dropdown-item" onClick={() => {removeRecipe(recipe)}}>{t('Delete_recipe')}</button> : ''}
        {user.id != recipe.user_id ? <button type="button" className="dropdown-item" onClick={() => removeFavoriteRecipe(fav, recipe)}>{t('Remove_from_favorites')}</button> : ''}
      </span>
    </span>
  </>
}

export const RecipeList = ({list, selected, recipes, user}) => {

  return (<>
    <ul id="recipes" className="recipe-list">
      {list.map((item, current) => {
        let {fav, recipe} = item
        //let recipeTags = suggestions.filter(suggestion => suggestion.recipe_id == recipe.id).map(suggestion => tags.find(t => t.id == suggestion.tag_id))
        //let mix = mixes.find(e => e.recipe_id == recipe.id)
              //{mix ? <img src="/img/logo_001.svg" width="24" height="24"/> : ''}
            //<span className='ms-2' style={{color: 'gray', fontSize: '0.78em', flexShrink: '3'}}>{recipeTags.map(tag => ` #${tag?.name}`)} </span>
        
        return (
          <li key={recipe.id} className='d-flex align-items-center'>
            <Link path={'/r/'+recipe.id} style={{color: 'black', fontSize: '1.1em', textDecoration: 'none'}} className={current == selected ? "selected" : undefined}>
              <div className="d-flex align-items-center">
                <RecipeThumbnailImage {...{recipe}} />
                <div style={{marginRight: '0.5em'}}></div>
                {recipe.name}
              </div>
            </Link>
            <span className="flex-grow-1"/>
            <RecipeListItemMenu {...{fav, recipe, user}} />
          </li>
        )
      })}
    </ul>
  </>)
}

export const RecipeIndex = ({favoriteRecipes, suggestions, tags, mixes, recipes, user, images}) => {

  const [recipeToEdit, setRecipeToEdit] = useState(null)
  //const [showModal, setShowModal] = useState(true)
  
  console.log('favoriteRecipes', favoriteRecipes)

  let publicRecipes = []
  let privateRecipes = []
  let favList = []

  recipes.forEach((recipe) => {
    f = favoriteRecipes.find(r => r.recipe_id == recipe.id)
    if (recipe.user_id == user.id) {
      if (recipe.is_public) {publicRecipes.push({recipe: recipe, fav: f})}
      else {privateRecipes.push({recipe: recipe, fav: f})}
    }
    else if (f) { favList.push({recipe: recipe, fav: f}) }
  })

  //let editUserRecipe = (recipe) => {
  //  setRecipeToEdit(recipe)
  //  setShowModal(true)
  //}

  let listArgs = {suggestions, tags, mixes, recipes, user, images}

    //<EditTagsModal {...{recipe: recipeToEdit, tags, suggestions, showModal, setShowModal}} />
  return (<>
    <br/>
    {publicRecipes.length || privateRecipes.length ? '' : <p>{t('No_personal_recipes_yet')}.</p>}
    {publicRecipes.length == 0 ? null : <>
      <h3 className="h001">{t('My_public_recipes')}</h3>
      <RecipeList list={publicRecipes} {...listArgs} />
    </>}
    {privateRecipes.length == 0 ? null : <>
      <h3 className="h001">{t('My_private_recipes')}</h3>
      <RecipeList list={privateRecipes} {...listArgs} />
    </>}
    {favList.length == 0 ? null : <>
      <h3 className="h001">{t('Favorite_recipes')}</h3>
      <RecipeList list={favList} {...listArgs} />
    </>}
  </>)
}
