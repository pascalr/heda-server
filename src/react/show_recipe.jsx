import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { recipeIngredientsAndHeaders, prettyPreposition } from "../lib"
import { normalizeSearchText, join, capitalize } from "./utils"
import { image_slug_variant_path } from "./routes"
import { t } from "../translate"
import { RecipeTiptap } from './tiptap'
import { RecipeMediumImage } from "./image"
import { getLocale, Link, useFetch } from "./lib"
import { RecipeAttributes, IngredientList } from "./recipe_viewer"

export const RecipeViewer = ({recipe, user, locale, recipeKind, kindAncestors}) => {
  
  const image = useFetch('/fetch_image/'+recipe.image_slug)

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
    {!recipeKind ? null :
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb" style={{margin: '-0.15em 0 0.5em 0'}}>
          {(kindAncestors||[]).map(kind => {
            return <li key={kind.id} className="breadcrumb-item"><Link path={'/k/'+kind.id}>{kind.name}</Link></li>
          })}
          <li className="breadcrumb-item" aria-current="page"><Link path={'/k/'+recipeKind.id}>{recipeKind.name}</Link></li>
          <li className="breadcrumb-item active" aria-current="page">{recipe.name}</li>
        </ol>
      </nav>
    }
    <div className="recipe">
      <div className="d-block d-md-flex" style={{gap: '20px'}}>
        <div><RecipeMediumImage {...{recipe, image, showCredit: true}} /></div>
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
  const [recipeKind, ] = useState(gon.recipe_kind)
  const [kindAncestors, ] = useState(gon.kind_ancestors)
  const [translatedRecipe, ] = useState(gon.translated_recipe||{})
  const [user, ] = useState(gon.user)

  let shown = translatedRecipe ? {...recipe, ...translatedRecipe} : recipe

  return <>
    <div className='trunk'>
      <RecipeViewer {...{recipe: shown, user, locale, recipeKind, kindAncestors}} />
    </div>
  </>
}
