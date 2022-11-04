import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { TextInput, TextField } from "./form"
import { Link, useOrFetchRecord, getLocale } from "./lib"
import { MainSearch } from './main_search'
import { HomeTab } from './app'
import { t } from "../translate"
import { useRouter } from "./router"
import { initHcu, useHcuState, handleError } from '../hcu'
import { RecipeViewer } from "./show_recipe"
import { ajax } from "./utils"
import Translator, { TranslationsCacheStrategy, LogStrategy, StoreStrategy } from '../translator'

const AdminTabs = ({machines}) => {
  return <>
    <ul className="nav nav-tabs mb-3">
      <HomeTab {...{title: t('Admin'), path: '/admin'}} />
      <HomeTab {...{title: t('Translations'), path: '/admin/translations'}} />
      <HomeTab {...{title: t('Translate Recipe'), path: '/admin/translate_recipe'}} />
    </ul>
  </>
}

const AdminPage = () => <h1>Admin page</h1>
const TranslationsPage = () => <h1>Translations page</h1>

const TranslateRecipePage = ({translations, recipes, locale}) => {
  const [recipeId, setRecipeId] = useState(null)
  const [translated, setTranslated] = useState(null)
  const [translationParts, setTranslationParts] = useState(null)

  const recipe = useOrFetchRecord('recipes', recipes, recipeId)

  //useEffect(() => {
  //  if (recipeId && (!translated || translated.original_id != recipeId)) {
  //    ajax({url: '/fetch_recipe_translation/'+recipeId, type: 'GET', success: (fetched) => {
  //      setTranslated(fetched)
  //    }, error: handleError(t('Error_fetching')) })
  //  }
  //}, [recipeId])
      
  let from = 1 // French FIXME
  let to = 4 // English FIXME

  useEffect(() => {
    if (recipe) {
      let cache = new TranslationsCacheStrategy(translations, from, to)
      let store = new StoreStrategy()
      let translator = new Translator(store, cache)
      translator.translateRecipe(recipe).then(translated => {
        setTranslated(translated)
        setTranslationParts(store.unique())
      })
    }
  }, [translations, recipe])

  const shown = translated ? {...recipe, ...translated} : null

  let cache = {}
  translations.forEach(translation => {
    if (translation.from == from && translation.to == to) {
      cache[translation.original] = translation
    } else if (translation.to == from && translation.from == to) {
      cache[translation.translated] = translation
    }
  })

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
    <h2>Translations</h2>
    <hr/>
    {(translationParts||[]).map(part => {
      return <div key={part}>
        <div className='d-flex justify-content-between'>
          <div style={{width: '49%'}}>
            {part}
          </div>
          <div style={{width: '49%'}}>
            {(() => {
              let cached = cache[part]
              if (cached) {
                let attr = (cached.from == from && cached.to == to) ? 'translated' : 'original'
                return <TextField model={cached} field={attr} style={{width: '100%'}} />
              } else {
                return <TextInput onBlur={(value) => {window.hcu.createRecord('translations', {from: from, to: to, original: part, translated: value})}} style={{width: '100%', backgroundColor: '#ff9494'}} />
              }
            })()}
          </div>
        </div>
        <hr/>
      </div>
    })}
  </>
}

export const Admin = () => {
  
  if (!window.hcu) {initHcu()}

  const locale = getLocale()
  const translations = useHcuState(gon.translations, {tableName: 'translations'})
  const recipes = useHcuState([], {tableName: 'recipes'})

  const routes = [
    {match: "/admin/translations", elem: () => <TranslationsPage />},
    {match: "/admin/translate_recipe", elem: () => <TranslateRecipePage {...{recipes, locale, translations}} />},
    {match: "/admin", elem: () => <AdminPage />},
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
