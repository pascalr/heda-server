import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { localeHref } from "../utils"
import { RecipeMediumImage } from "./image"
import { MainSearch } from './main_search'
import { getLocale } from "./lib"
import { t } from "../translate"
import { IngredientList } from "./recipe_viewer"
import { DescriptionTiptap, RecipeTiptap } from "./tiptap"

const Recipe = ({recipe}) => {
  return <div className="p-2" style={{border: '1px solid black', borderRadius: '5px'}}>
    <div className="p-2 ps-3 white" style={{backgroundColor: '#212529'}}>
      <div className="float-end">{t('by')} <a className="plain-link underline white" href={'/u/'+recipe.user_id}>{recipe.user_name}</a></div>
      <div className="fs-12 bold">
        {recipe.name}
      </div>
    </div>
    <div className="recipe-body">

      <h2 style={{flexGrow: '1'}}>{t('Ingredients')}</h2>
      <IngredientList {...{recipe}} />
    
      <h2>{t('Instructions')}</h2>
      <RecipeTiptap recipe={recipe} editable={false} />
    </div>
  </div>
}

export const ShowRecipeKind = () => {

  const locale = getLocale()
  const [recipeKind, ] = useState(gon.recipe_kind)
  const [recipes, ] = useState(gon.recipes)
  const [recipeIdx, setRecipeIdx] = useState(0)

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
      <br/>
      <div>
        {recipes && recipes.length > 0 ? <>
          <div className='fs-13 mb-1'>
            {t('Users_recipes')} ({recipeIdx+1} {t('of')} {recipes.length})
            <button className="btn btn-sm btn-outline-primary mx-2" disabled={recipeIdx === 0} onClick={() => setRecipeIdx(recipeIdx-1)}>{t('Previous_f')}</button>
            <button className="btn btn-sm btn-outline-primary" disabled={recipeIdx === recipes.length-1} onClick={() => setRecipeIdx(recipeIdx+1)}>{t('Next_f')}</button>
          </div>
          <Recipe {...{recipe: recipes[recipeIdx]}} />
        </> : ''}
      </div>
    </div>
  </>
}
