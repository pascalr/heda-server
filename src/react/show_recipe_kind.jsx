import React, { useState, useEffect, useRef } from 'react'

import { RecipeMediumImage, RecipeSmallImage } from "./image"
import { PublicNavbar } from './main_search'
import { getLocale, Link } from "./lib"
import { t } from "../translate"
import { IngredientList } from "./recipe_viewer"
import { DescriptionTiptap, RecipeTiptap } from "./tiptap"
import { prettyMinutes } from "../lib"
import { ErrorBoundary } from './error_boundary'

const RecipeAttribute = ({recipe, attr, label}) => {
  if (!recipe[attr]) {return ''}
  return <>
    <div className="d-inline-block" style={{width: '50%'}}>
      <b>{t(label)}:</b> <span className="gray">{prettyMinutes(recipe[attr])}</span>
    </div>
  </>
}

const Recipe = ({recipe, recipeKind}) => {
  if (!recipe) {return null}
  return <>
    <div style={{border: '1px solid black'}}>
      <div className="p-2 ps-3 white" style={{backgroundColor: '#212529'}}>
        <div className="float-end">{t('by')} <Link className="plain-link underline white" path={'/u/'+recipe.user_id}>{recipe.user_name}</Link></div>
        <div className="fs-12 bold">
          <Link className="plain-link white" path={'/r/'+recipe.id}>{recipe.name}</Link>
        </div>
      </div>
      <div className="recipe-body p-2">
        {recipe.image_slug && recipe.image_slug != recipeKind.image_slug ?
          <div className="float-start mb-2 me-2">
            <RecipeSmallImage {...{recipe}} />
          </div>
        : null}

        <RecipeAttribute {...{recipe, attr: 'preparation_time', label: 'Preparation'}} />
        <RecipeAttribute {...{recipe, attr: 'cooking_time', label: 'Cooking'}} />
        <RecipeAttribute {...{recipe, attr: 'total_time', label: 'Total'}} />

        <h2 style={{flexGrow: '1', clear: 'left'}}>{t('Ingredients')}</h2>
        <IngredientList {...{recipe}} />
      
        <h2>{t('Instructions')}</h2>
        <RecipeTiptap recipe={recipe} editable={false} />
      </div>
    </div>
  </>
}

export const RecipeKindViewer = ({recipeKind, recipes, kindAncestors, recipeButtons, locale}) => {

  const [recipeIdx, setRecipeIdx] = useState(0)
  const [localeFilter, setLocaleFilter] = useState(locale)

  if (!recipeKind || !recipes) {return ''}

  let filtered = recipes.filter(r => {
    let filtered = false
    if (localeFilter) {filtered = filtered || r.locale != localeFilter}
    return !filtered
  })
 
  let recipeButtonsV = recipeButtons && filtered && filtered.length > 0 && recipeButtons(filtered[recipeIdx])
  let recipeButtonsE = recipeButtonsV ?
    <div style={{border: '2px solid #212529', padding: '0.4em 0.4em 0.2em 0.4em', borderBottom: 'none', borderTopLeftRadius: '0.5em', borderTopRightRadius: '0.5em', flexShrink: '0'}}>
      {recipeButtons(filtered[recipeIdx])}
    </div> : ''

  let idx = recipeIdx >= filtered.length ? recipeIdx - 1 : recipeIdx
  let nbFiltered = recipes.length - filtered.length

  return <>
    <div className="trunk">
      {!kindAncestors?.length ? null :
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb" style={{margin: '-0.15em 0 0.5em 0'}}>
            {(kindAncestors||[]).map(kind => {
              return <li key={kind.id} className="breadcrumb-item"><Link path={'/d/'+kind.id}>{kind.name}</Link></li>
            })}
            <li className="breadcrumb-item active" aria-current="page">{recipeKind.name}</li>
          </ol>
        </nav>
      }
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
          <div className='d-flex align-items-end'>
            <div>
              <div className='fs-13 d-flex align-items-center flex-wrap mb-1'>
                <div>({idx+1} {t('of')} {filtered.length}) {filtered.length > 1 ? t('recipes') : t('recipe')} {nbFiltered > 0 ? <i className="gray fs-08">({nbFiltered} {t('filtered')})</i> : ''}</div>
                <div>
                  <button className="btn btn-sm btn-outline-primary mx-2" disabled={idx === 0} onClick={() => setRecipeIdx(idx-1)}>{t('Previous_f')}</button>
                  <button className="btn btn-sm btn-outline-primary" disabled={idx === filtered.length-1} onClick={() => setRecipeIdx(idx+1)}>{t('Next_f')}</button>
                  <button className="btn btn-sm btn-outline-secondary mx-2" type="button" data-bs-toggle="collapse" data-bs-target="#filters" aria-expanded="false" aria-controls="filters">{t('Filter')}</button>
                </div>
              </div>
              <div className="collapse" id="filters">
                <div className="dropdown">
                  <button className="btn btn-sm btn-outline-secondary dropdown-toggle mb-1" data-bs-toggle="dropdown" type="button">
                    {t('Language')}
                  </button>
                  <div className="dropdown-menu">
                    <button type="button" className="dropdown-item" onClick={() => {setLocaleFilter(null)}}>None</button> 
                    <button type="button" className="dropdown-item" onClick={() => {setLocaleFilter('fr')}}>FR</button> 
                    <button type="button" className="dropdown-item" onClick={() => {setLocaleFilter('en')}}>EN</button> 
                  </div>
                </div>
              </div>
            </div>
            <div className='flex-grow-1' />
            {recipeButtonsE}
          </div>
          <Recipe {...{recipe: filtered[idx], recipeKind}} />
        </> : <>
          <p>{t('There_are_no_recipe_in_this_category_yet')}.</p>
          <br/>
          <Link path={'/n'} className='btn btn-primary'>{t('Create_new_recipe')}</Link>
        </>}
      </div>
    </div>
  </>
}

export const ShowRecipeKind = () => {

  const locale = getLocale()
  const [recipeKind, ] = useState(gon.recipeKind)
  const [recipes, ] = useState(gon.recipes)
  const [kindAncestors, ] = useState(gon.kindAncestors||[])

  // TODO: Show credit
  //<div><RecipeMediumImage {...{recipe: recipeKind, images, showCredit: true}} /></div>
  return <>
    <PublicNavbar {...{locale}} />
    <ErrorBoundary>
      <RecipeKindViewer {...{recipeKind, recipes, kindAncestors, locale}} />
    </ErrorBoundary>
  </>
}
