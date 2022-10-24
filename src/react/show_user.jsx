import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { MainSearch, useMainSearch } from './home'
import { RecipeThumbnailImage } from "./image"
import { isBlank, normalizeSearchText, join, sortBy, capitalize } from "./utils"
import { image_slug_variant_path } from "./routes"
import { t } from "../translate"
import { localeHref, getUrlParams } from "../utils"

const RecipeItem = ({recipe, images, recipeKinds}) => {
  return (
    <a href={localeHref("/r/"+recipe.id)} className="plain-link">
      <li style={{fontSize: '1.1rem'}}>
        <div className="d-flex align-items-center">
          <RecipeThumbnailImage {...{recipe, recipeKinds, images}} />
          <div style={{marginRight: '0.5em'}}></div>
          <span>{recipe.name}</span>
        </div>
      </li>
    </a>
  )
}

const ShowUser = () => {

  const [recipes, ] = useState(gon.recipes)
  const [images, ] = useState(gon.images)
  const [recipeKinds, ] = useState(gon.recipe_kinds)
  const [user, ] = useState(gon.user)
  //const [favoriteRecipes, ] = useState(gon.favorite_recipes)

  const [publicUsers, ] = useState(gon.public_users)
  const isSearching = useMainSearch()

  const userRecipes = recipes.filter(r => r.user_id == user.id)
  const favRecipes = recipes.filter(r => r.user_id != user.id)

  return <>
    <div style={{maxWidth: '800px', margin: 'auto', padding: '0.5em 0'}}>
      {isSearching && publicUsers ? <MainSearch {...{publicUsers}} /> : ''}
      <h3 className="h001">{t('Recipes_by')} {user.name}</h3>
      <ul className="recipe-list">
        {userRecipes.map(r => <RecipeItem key={r.id} {...{recipe: r, images, recipeKinds}} />)}
      </ul>
      {favRecipes.length > 0 ? <h3 className="h001">{t('Favorites')}</h3> : ''}
      <ul className="recipe-list">
        {favRecipes.map(r => <RecipeItem key={r.id} {...{recipe: r, images, recipeKinds}} />)}
      </ul>
    </div>
  </>
}

document.addEventListener('DOMContentLoaded', () => {

  window.locale = getUrlParams(window.location.href).locale
  const root = document.getElementById('root-u')
  if (root) {ReactDOM.render(<ShowUser />, root)}
  //const root = createRoot(document.getElementById("root"));
  //root.render(<UserEditor/>);
})
