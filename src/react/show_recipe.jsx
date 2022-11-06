import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { MainSearch } from './main_search'
import { parseIngredientsAndHeaders, prettyPreposition } from "../lib"
import { normalizeSearchText, join, capitalize } from "./utils"
import { image_slug_variant_path } from "./routes"
import { t } from "../translate"
import { RecipeTiptap } from './tiptap'
import { RecipeMediumImage } from "./image"
import { localeHref } from "../utils"
import { getLocale } from "./lib"
import { RecipeAttributes } from "./recipe_viewer"

export const RecipeViewer = ({recipe, images, user, locale}) => {

  const ingredientsAndHeaders = parseIngredientsAndHeaders(recipe.ingredients)
  const ingredients = ingredientsAndHeaders.filter(e => e.label || e.qty)

  const IngredientList = 
    <div id="ing_list">
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
        <li className="breadcrumb-item"><a href={localeHref('/u/'+user.id)}>{user.name}</a></li>
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
        {IngredientList}
      
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
      <RecipeViewer {...{recipe: shown, images, user, locale}} />
    </div>
  </>
}
