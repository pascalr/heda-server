import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { MainSearch } from './main_search'
import { recipeIngredientsAndHeaders, prettyPreposition } from "../lib"
import { normalizeSearchText, join, capitalize } from "./utils"
import { image_slug_variant_path } from "./routes"
import { t } from "../translate"
import { RecipeTiptap } from './tiptap'
import { RecipeMediumImage } from "./image"
import { getLocale, Link } from "./lib"
import { RecipeAttributes, IngredientList } from "./recipe_viewer"
import { ErrorBoundary } from './error_boundary'

export const RecipeViewer = ({recipe, images, user, locale}) => {

  //<div className="d-flex" style={{gap: '5px', marginTop: '10px'}}>
  //  <a className="btn btn-outline-secondary" href="FIXME">
  //    <img src="/icons/printer.svg" width="16"></img>
  //  </a>
  //  <a className="btn btn-outline-secondary" href="FIXME">
  //    <img src="/icons/share.svg" width="16"></img>
  //  </a>
  //  <a className="btn btn-outline-secondary" href="FIXME">
  //    <img src="/icons/download.svg" width="16"></img>
  //  </a>
  //</div>

  return (<>
    <nav aria-label="breadcrumb">
      <ol className="breadcrumb" style={{margin: '-0.5em 0 0.5em 0'}}>
        <li className="breadcrumb-item"><Link path={'/u/'+user.id}>{user.name}</Link></li>
        <li className="breadcrumb-item active" aria-current="page">{recipe.name}</li>
      </ol>
    </nav>
    <div className="recipe">
      <div className="d-block d-md-flex" style={{gap: '20px'}}>
        <div><RecipeMediumImage {...{recipe, images, showCredit: true}} /></div>
        <div style={{height: '20px', width: '0'}}></div>
        <div style={{width: '100%'}}>
          <RecipeAttributes {...{recipe, userName: user.name}} />
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

export const ShowRecipe = () => {

  const locale = getLocale()
  const [recipe, ] = useState(gon.recipe)
  const [translatedRecipe, ] = useState(gon.translated_recipe||{})
  const [images, ] = useState(gon.images)
  const [user, ] = useState(gon.user)

  let shown = translatedRecipe ? {...recipe, ...translatedRecipe} : recipe

  return <>
    <MainSearch {...{locale}} />
    <div style={{maxWidth: '800px', margin: 'auto', padding: '0.5em 0'}}>
      <ErrorBoundary>
        <RecipeViewer {...{recipe: shown, images, user, locale}} />
      </ErrorBoundary>
    </div>
  </>
}
