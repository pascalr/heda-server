import React, { useState, useEffect, useRef } from 'react'

import { localeHref } from "../utils"
import { RecipeMediumImage } from "./image"
import { MainSearch } from './main_search'
import { getLocale } from "./lib"
import { t } from "../translate"
import { IngredientList } from "./recipe_viewer"
import { DescriptionTiptap, RecipeTiptap } from "./tiptap"
import { prettyMinutes } from "../lib"

const RecipeAttribute = ({recipe, attr, label}) => {
  if (!recipe[attr]) {return ''}
  return <>
    <div className="d-inline-block" style={{width: '50%'}}>
      <b>{t(label)}:</b> <span className="gray">{prettyMinutes(recipe[attr])}</span>
    </div>
  </>
}

const Recipe = ({recipe}) => {
  return <div style={{border: '1px solid black'}}>
    <div className="p-2 ps-3 white" style={{backgroundColor: '#212529'}}>
      <div className="float-end">{t('by')} <a className="plain-link underline white" href={'/u/'+recipe.user_id}>{recipe.user_name}</a></div>
      <div className="fs-12 bold">
        <a className="plain-link white" href={'/r/'+recipe.id}>{recipe.name}</a>
      </div>
    </div>
    <div className="recipe-body p-2">

      <RecipeAttribute {...{recipe, attr: 'preparation_time', label: 'Preparation'}} />
      <RecipeAttribute {...{recipe, attr: 'cooking_time', label: 'Cooking'}} />
      <RecipeAttribute {...{recipe, attr: 'total_time', label: 'Total'}} />

      <h2 style={{flexGrow: '1'}}>{t('Ingredients')}</h2>
      <IngredientList {...{recipe}} />
    
      <h2>{t('Instructions')}</h2>
      <RecipeTiptap recipe={recipe} editable={false} />
    </div>
  </div>
}

export const RecipeKindViewer = ({recipeKind, recipes, kindAncestors}) => {

  if (!recipeKind) {return ''}

  const [recipeIdx, setRecipeIdx] = useState(0)

  return <>
    <div className="trunk">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb" style={{margin: '-0.15em 0 0.5em 0'}}>
          {(kindAncestors||[]).map(kind => {
            return <li key={kind.id} className="breadcrumb-item"><a href={localeHref('/d/'+kind.id)}>{kind.name}</a></li>
          })}
          <li className="breadcrumb-item active" aria-current="page">{recipeKind.name}</li>
        </ol>
      </nav>
      <div className="d-block d-md-flex">
        <RecipeMediumImage {...{recipe: recipeKind}} />
        <div style={{margin: '0.5em 0.5em'}}></div>
        <div>
          <h1 className="ff-satisfy bold fs-25">{recipeKind.name}</h1>
          <div className="fs-09">
            <DescriptionTiptap {...{model: recipeKind, json_field: 'description_json', editable: false}} />
          </div>
        </div>
      </div>
      <br/>
      <div id='recipes'>
        {recipes && recipes.length > 0 ? <>
          <div className='fs-13 d-flex align-items-center mb-1'>
            <div>({recipeIdx+1} {t('of')} {recipes.length}) {recipes.length > 1 ? t('recipes') : t('recipe')}</div>
            <div>
              <button className="btn btn-sm btn-outline-primary mx-2" disabled={recipeIdx === 0} onClick={() => setRecipeIdx(recipeIdx-1)}>{t('Previous_f')}</button>
              <button className="btn btn-sm btn-outline-primary" disabled={recipeIdx === recipes.length-1} onClick={() => setRecipeIdx(recipeIdx+1)}>{t('Next_f')}</button>
            </div>
          </div>
          <Recipe {...{recipe: recipes[recipeIdx]}} />
        </> : <p>{t('There_are_no_recipe_in_this_category_yet')}.</p>}
      </div>
    </div>
  </>
}

export const ShowRecipeKind = () => {

  const locale = getLocale()
  const [recipeKind, ] = useState(gon.recipe_kind)
  const [recipes, ] = useState(gon.recipes)
  const [kindAncestors, ] = useState(gon.kind_ancestors||[])

  // TODO: Show credit
  //<div><RecipeMediumImage {...{recipe: recipeKind, images, showCredit: true}} /></div>
  return <>
    <MainSearch {...{locale}} />
    <RecipeKindViewer {...{recipeKind, recipes, kindAncestors}} />
  </>
}
