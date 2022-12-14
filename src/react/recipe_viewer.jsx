import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'

import { ajax, changeUrl } from "./utils"
import { RecipeTiptap, BubbleTiptap } from './tiptap'
import { Link, useOrFetch } from "./lib"
import { recipeIngredientsAndHeaders, quantityWithPreposition, prettyPreposition, prettyTimeMinutesToWords } from "../lib"
import { RecipeMediumImage } from "./image"
//import { EditTagsModal } from './modals/edit_tags'
import { removeRecipe, AddToListMenu, ChangeVisibilityMenuItem, duplicateRecipe, updateFavoriteRecipe } from './recipe_index'
import { t } from "../translate"
import { handleError } from "../hcu"

export const IngredientList = ({recipe}) => {

  const ingredientsAndHeaders = recipeIngredientsAndHeaders(recipe)
  const ingredients = ingredientsAndHeaders.filter(e => e.label || e.qty)

  return <div id="ing_list">
    <ul className="list-group">
      {ingredientsAndHeaders.map((ingOrHeader,i) => {
        if (ingOrHeader.qty == null && ingOrHeader.label == null) {
          return <h3 key={ingOrHeader.key} style={{margin: "0", padding: "0.5em 0 0.2em 0"}}>
            {ingOrHeader.header}
          </h3>
        } else {
          const ing = ingOrHeader
          let preposition = prettyPreposition(ing.qty, ing.label, locale)
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
    </ul>
  </div>
}

export const RecipeAttributes = ({recipe, userName}) => {
  let attrs = [
    {label: 'Preparation', field: 'preparation_time'},
    {label: 'Cooking', field: 'cooking_time'},
    {label: 'Total', field: 'total_time'},
  ]
  return <>
    <div className='d-flex'>
      <h1>
        <span className="recipe-title">{recipe.name}</span>
      </h1>
      <div className='flex-grow-1' />
    </div>
    <div style={{marginTop: '-0.8em', marginBottom: '1.2em'}}>
      <span style={{color: 'gray'}}>{t('by')} {userName}</span>
    </div>
    {attrs.map(attr => {
      if (!recipe[attr.field]) {return null}
      return <div key={attr.field}>
        <b>{t(attr.label)}: </b>
        <span style={{color: 'gray'}}>{prettyTimeMinutesToWords(recipe[attr.field])}</span>
      </div>
    })}
    <div>
      <b>{t('Servings')}: </b>
      <span style={{color: 'gray'}}>{recipe.raw_servings}</span>
    </div>
  </>
}

export const DuplicateButton = ({recipe, ...props}) => {
  return <button type="button" className="plain-btn" onClick={() => duplicateRecipe(recipe)} {...props} >
    <img style={{width: '1.8em'}} src="/icons/files.svg" title={t('Copy_and_edit')} />
  </button> 
}

export const AddToListButton = ({recipe, user, favorite, ...props}) => {

  const inList = favorite && favorite.list_id == 1

  return <button type="button" className="plain-btn" onClick={() => updateFavoriteRecipe(favorite, inList ? 0 : 1, recipe, user)} {...props}>
    <img style={{width: '1.8em'}} src={"/icons/"+(inList ? 'remove' : 'add')+"-list.svg"} title={inList ? t('Remove_from_my_list') : t('Add_to_my_list')} />
  </button> 
}

export const FavoriteButton = ({recipe, user, favorite, width, ...props}) => {
  if (recipe.user_id == user.id) {return ''}
  const handleClick = () => {
    if (favorite) {
      window.hcu.destroyRecord(favorite)
    } else {
      window.hcu.createRecord('favorite_recipes', {recipe_id: recipe.id})
      if (!window.hcu.hasRecord('recipes', recipe)) {
        window.hcu.addRecord('recipes', recipe)
      }
    }
  }
  let img = favorite ? "/icons/heart-fill.svg" : "/icons/heart.svg"
  let title = favorite ? t('Remove_from_my_favorites') : t('Add_to_my_favorites')
  return <button type="button" className="btn btn-outline-secondary" onClick={handleClick} {...props}>
    <img src={img} width={width||"24"} title={title}></img>
  </button>
}
  
export const RecipeViewer = ({recipeId, favoriteRecipes, user, siblings, recipes, images}) => {

  //const [showModal, setShowModal] = useState(false)

  const recipe = useOrFetch('recipes', recipes, r => r.id == recipeId, '/fetch_recipe/'+recipeId)
  const slug = recipe ? recipe.image_slug : null
  const image = useOrFetch('images', images, (i) => i.slug == slug, '/fetch_image/'+slug, recipe)
  if (!recipe) {return ''}

  const noteIds = recipe.notes ? Object.values(recipe.notes).sort((a,b) => a.item_nb - b.item_nb).map(ing => ing.id) : []
  const toolIds = []
  //const recipeTags = suggestions.filter(s => s.recipe_id == recipe.id).map(s => tags.find(t => t.id == s.tag_id))
  const favorite = favoriteRecipes.find(f => f.recipe_id == recipe.id)

  const translateRecipe = () => {
    ajax({url: '/translate_recipe/'+recipe.id, type: 'POST', success: (translated) => {
      window.hcu.addRecord('recipes', translated)
      changeUrl('/e/'+translated.id)
    }, error: handleError(t('Error_creating'))})
  }
  
  const changeOwner = (e) => {
    let data = {recipeId: recipe.id, newOwnerId: user.id}
    ajax({url: '/change_recipe_owner', type: 'PATCH', data, success: () => {
      window.hcu.changeField(recipe, 'user_id', user.id)
    }, error: handleError(t('Error_updating'))})
  }
  
  const recipeBelongsToSiblings = siblings.map(u => u.id).filter(id => id != user.id).includes(recipe.user_id)
  const isUser = recipe.user_id == user.id

  let userName = recipe.user_name
  if (!userName) {
    const recipeUser = [...siblings, (user||{})].find(u => u.id == recipe.user_id)
    userName = recipeUser ? recipeUser.name : `user${recipe.user_id}`
  }

    //<EditTagsModal {...{recipe, tags, suggestions, showModal, setShowModal}} />
            //<button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(true)}>
            //  <img src="/icons/tags.svg" width="24"></img>
            //</button>
  return (<>
    <div className="recipe mt-3">
      <div className="d-block d-md-flex" style={{gap: '20px'}}>
        <div><RecipeMediumImage {...{recipe, images: image ? [image] : null, showCredit: true}} /></div>
        <div style={{height: '20px', width: '0'}}></div>
        <div style={{width: '100%'}}>
          <RecipeAttributes {...{recipe, userName}} />
          <div className="d-flex" style={{gap: '5px', marginTop: '10px'}}>
            {isUser ?
              <Link path={'/e/'+recipe.id} className="btn btn-outline-secondary">
                <img src="/icons/pencil.svg" width="24"></img>
              </Link>
            : ''}
            <FavoriteButton {...{recipe, user, favorite}} />
            <AddToListButton {...{recipe, user, favorite}} className='btn btn-outline-secondary' />
            {recipe.user_id != user.id ? <DuplicateButton {...{recipe}} className='btn btn-outline-secondary' /> : ''}
            <span className="dropdown">
              <a className="btn btn-outline-secondary" href="FIXME" data-bs-toggle="dropdown">
                <img src="/icons/three-dots.svg" width="24"></img>
              </a>
              <div className="dropdown-menu">
                {recipeBelongsToSiblings ? <button type="button" className="dropdown-item" onClick={changeOwner}>{t('Attribute_to_this_profile')}</button> : ''}
                {recipe.user_id == user.id ? <li><ChangeVisibilityMenuItem recipe={recipe} /></li> : ''}
                <hr className="dropdown-divider"/>
                {recipe.user_id == user.id ? <li><button type="button" className="dropdown-item" onClick={() => {removeRecipe(recipe) && changeUrl('/l')}}>{t('Delete_recipe')}</button></li> : ''}
                {user.is_admin && recipe.user_id != user.id ? <button type="button" className="dropdown-item" onClick={translateRecipe}>Translate recipe</button> : ''}
              </div>
            </span>
          </div>
        </div>
      </div>
      <div className="recipe-body">

        <h2 style={{flexGrow: '1'}}>{t('Ingredients')}</h2>
        <IngredientList {...{recipe}} />
      
        <h2>{t('Instructions')}</h2>
        <RecipeTiptap recipe={recipe} editable={false} />
      </div>
      <br/><br/><br/><br/><br/><br/><br/><br/>
    </div>
  </>)
}

export default RecipeViewer;
