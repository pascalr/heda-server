import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { TextInput } from "./form"
import { Link, useOrFetchRecord } from "./lib"
import { MainSearch } from './main_search'
import { HomeTab } from './app'
import { t } from "../translate"
import { useRouter } from "./router"
import { initHcu, useHcuState, handleError } from '../hcu'
import { RecipeViewer } from "./show_recipe"
import { ajax } from "./utils"

const AdminTabs = ({machines}) => {
  return <>
    <ul className="nav nav-tabs mb-3">
      <HomeTab {...{title: t('Admin'), path: '/admin'}} />
      <HomeTab {...{title: t('Translations'), path: '/translations'}} />
      <HomeTab {...{title: t('Translate Recipe'), path: '/translate_recipe'}} />
    </ul>
  </>
}

const AdminPage = () => <h1>Admin page</h1>
const TranslationsPage = () => <h1>Translations page</h1>


const TranslateRecipePage = ({recipes, locale}) => {
  const [recipeId, setRecipeId] = useState(null)
  const [translated, setTranslated] = useState(null)

  const recipe = useOrFetchRecord('recipes', recipes, recipeId)

  useEffect(() => {
    if (recipeId && (!translated || translated.original_id != recipeId)) {
      ajax({url: '/fetch_recipe_translation/'+recipeId, type: 'GET', success: (fetched) => {
        setTranslated(fetched)
      }, error: handleError(t('Error_fetching')) })
    }
  }, [recipeId])

  const shown = translated ? {...recipe, ...translated} : null

  return <>
    <h1>Translate recipe</h1>
    Recipe id: <TextInput onBlur={setRecipeId} />
    <br/><br/>
    <div className='d-flex justify-content-between'>
      <div style={{width: '49%'}}>
        <h2>Original</h2>
        {recipe ? <RecipeViewer {...{recipe, locale, user: {}}} /> : ''}
      </div>
      <div style={{width: '49%'}}>
        <h2>Translated</h2>
        {shown ? <RecipeViewer {...{recipe: shown, locale, user: {}}} /> : ''}
      </div>
    </div>
  </>
}

export const Admin = () => {
  
  if (!window.hcu) {initHcu()}

  const [locale, ] = useState(gon.locale)
  const recipes = useHcuState([], {tableName: 'recipes'})

  const routes = [
    {match: "/admin", elem: () => <AdminPage />},
    {match: "/translations", elem: () => <TranslationsPage />},
    {match: "/translate_recipe", elem: () => <TranslateRecipePage {...{recipes, locale}} />},
  ]
  const defaultElement = (params) => <TranslationsPage />
  
  const elem = useRouter(routes, defaultElement)
  
  return <>
    <MainSearch {...{locale}} />
    <div style={{padding: '0 0.5em'}}>
      <AdminTabs/>
      {elem}
    </div>
    <br/><br/><br/><br/><br/><br/><br/><br/>
  </>
}

root = document.getElementById('root-admin')
if (root) {ReactDOM.render(<Admin />, root)}
