import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { RecipeThumbnailImage } from "./image"
import { isBlank, normalizeSearchText, join, sortBy, capitalize } from "./utils"
import { image_slug_variant_path } from "./routes"
import { t } from "../translate"

const RecipeItem = ({recipe, images, recipeKinds}) => {
  return (
    <li className="clickable" style={{fontSize: '1.1rem'}} onClick={() => window.location.href = "/r/"+recipe.id}>
      <div className="d-flex align-items-center">
        <RecipeThumbnailImage {...{recipe, recipeKinds, images}} />
        <div style={{marginRight: '0.5em'}}></div>
        <span>{recipe.name}</span>
      </div>
    </li>
  )
}

const ShowUser = () => {

  const [recipes, ] = useState(gon.recipes)
  const [images, ] = useState(gon.images)
  const [recipeKinds, ] = useState(gon.recipe_kinds)
  const [user, ] = useState(gon.user)

  return <>
    <div style={{maxWidth: '800px', margin: 'auto', padding: '0.5em 0 0.5em 0'}}>
      <h3 className="h001">{t('Recipes_by')} {user.name}</h3>
      <ul className="recipe-list">
        {recipes.map(r => <RecipeItem key={r.id} {...{recipe: r, images, recipeKinds}} />)}
      </ul>
      <h3 className="h001">{t('Favorites')}</h3>
    </div>
  </>
}

document.addEventListener('DOMContentLoaded', () => {

  const root = document.getElementById('root')
  ReactDOM.render(<ShowUser />, root)
  //const root = createRoot(document.getElementById("root"));
  //root.render(<UserEditor/>);
})
