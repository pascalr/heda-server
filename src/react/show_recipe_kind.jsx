import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { localeHref } from "../utils"
import { RecipeMediumImage } from "./image"
import { MainSearch } from './main_search'
import { getLocale } from "./lib"
import { t } from "../translate"
import { DescriptionTiptap } from "./tiptap"

export const ShowRecipeKind = () => {

  const locale = getLocale()
  const [recipeKind, ] = useState(gon.recipe_kind)
  const [recipes, ] = useState(gon.recipes)

  // TODO: Show credit
  //<div><RecipeMediumImage {...{recipe: recipeKind, images, showCredit: true}} /></div>
  return <>
    <MainSearch {...{locale}} />
    <div className="trunk">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb" style={{marginBottom: '0.5em'}}>
          <li className="breadcrumb-item"><a href={localeHref('/TODO')}>TODO</a></li>
          <li className="breadcrumb-item active" aria-current="page">{recipeKind.name}</li>
        </ol>
      </nav>
      <div className="d-flex">
        <RecipeMediumImage {...{recipe: recipeKind}} />
        <div style={{marginRight: '1em'}}></div>
        <div>
          <h1 className="ff-satisfy bold fs-25">{recipeKind.name}</h1>
          <div className="fs-09">
            <DescriptionTiptap {...{model: recipeKind, json_field: 'description_json', editable: false}} />
          </div>
        </div>
      </div>
      <div>
        1 of {recipes.length} recipes
      </div>
    </div>
  </>
}
