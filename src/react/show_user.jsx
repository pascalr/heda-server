import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { MainSearch } from './main_search'
import { RecipeThumbnailImage, RecipeSmallImage } from "./image"
import { normalizeSearchText, join, capitalize } from "./utils"
import { image_slug_variant_path } from "./routes"
import { t } from "../translate"
import { localeHref, getUrlParams } from "../utils"
import { getLocale } from "./lib"
import { recipeIngredientsAndHeaders, extractFoodNameFromIngredient, prettyMinutes } from "../lib"

const RecipeAttribute = ({recipe, attr, label}) => {
  if (!recipe[attr]) {return ''}
  return <div key={attr}>
    <b>{t(label)}:</b> <span className="gray">{prettyMinutes(recipe[attr])}</span>
  </div>
}

const RecipeSmallItem = ({recipe}) => {
  let ingredients = recipeIngredientsAndHeaders(recipe).filter(i => !i.header)
  // TODO: Sort the ingredients by weight.
  let mainIngredients = ingredients.slice(0,4)
  let labels = mainIngredients.map(i => extractFoodNameFromIngredient(i.label)).join(', ')
  if (ingredients.length != mainIngredients.length) {labels += ', ...'}
  return (
    <a href={localeHref("/r/"+recipe.id)} className="plain-link">
      <li>
        <div className="d-block d-sm-flex">
          <RecipeSmallImage {...{recipe}} />
          <div style={{marginRight: '1em'}}></div>
          <div>
            <div className="fsr-22 ff-satisfy bold mt-2" style={{lineHeight: '1'}}>{recipe.name}</div>
            {ingredients.length === 0 ? '' :
              <div><b>{t('Ingredients')}:</b> <span className="gray">{labels}</span></div>
            }
            <RecipeAttribute {...{recipe, attr: 'preparation_time', label: 'Preparation'}} />
            <RecipeAttribute {...{recipe, attr: 'cooking_time', label: 'Cooking'}} />
            <RecipeAttribute {...{recipe, attr: 'total_time', label: 'Total'}} />
          </div>
          <div style={{marginTop: '4em'}}></div>
        </div>
      </li>
    </a>
  )
}

const RecipeThumbnailItem = ({recipe}) => {
  return (
    <a href={localeHref("/r/"+recipe.id)} className="plain-link">
      <li style={{fontSize: '1.1rem'}}>
        <div className="d-flex align-items-center">
          <RecipeThumbnailImage {...{recipe}} />
          <div style={{marginRight: '0.5em'}}></div>
          <span>{recipe.name}</span>
        </div>
      </li>
    </a>
  )
}

export const ShowUser = () => {

  const locale = getLocale()
  const [recipes, ] = useState(gon.recipes)
  const [images, ] = useState(gon.images)
  const [recipeKinds, ] = useState(gon.recipe_kinds)
  const [user, ] = useState(gon.user)
  //const [favoriteRecipes, ] = useState(gon.favorite_recipes)

  const userRecipes = recipes.filter(r => r.user_id == user.id)
  const favRecipes = recipes.filter(r => r.user_id != user.id)

  return <>
    <MainSearch {...{locale}} />
    <div className="trunk">
      <h3>{t('Recipes_by')} {user.name}</h3>
      <ul className="recipe-list-2">
        {userRecipes.map(r => <RecipeSmallItem key={r.id} {...{recipe: r, images, recipeKinds}} />)}
      </ul>
      {favRecipes.length > 0 ? <h3 className="h001">{t('Favorites')}</h3> : ''}
      <ul className="recipe-list-2">
        {favRecipes.map(r => <RecipeSmallItem key={r.id} {...{recipe: r, images, recipeKinds}} />)}
      </ul>
    </div>
  </>
}
