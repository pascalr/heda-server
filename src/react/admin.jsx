import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import toastr from 'toastr'
//import { createRoot } from 'react-dom/client';

import { TextInput, TextField } from "./form"
import { Link, useOrFetchRecipe, getLocale } from "./lib"
import { localeAttr } from "../lib"
import { MainSearch } from './main_search'
import { HomeTab } from './app'
import { t } from "../translate"
import { useRouter } from "./router"
import { initHcu, useHcuState, handleError } from '../hcu'
import { RecipeViewer } from "./show_recipe"
import { ajax } from "./utils"
import Translator, { TranslationsCacheStrategy, LogStrategy, StoreStrategy } from '../translator'
import { RecipeThumbnailImage, RecipeMediumImage } from "./image"
import { DescriptionTiptap } from "./tiptap"

const AdminTabs = ({machines}) => {
  return <>
    <ul className="nav nav-tabs mb-3">
      <HomeTab {...{title: t('Admin'), path: '/admin'}} />
      <HomeTab {...{title: t('RecipeKinds'), path: '/admin/ki'}} />
      <HomeTab {...{title: t('SQL'), path: '/admin/sql'}} />
      <HomeTab {...{title: t('Translations'), path: '/admin/translations'}} />
      <HomeTab {...{title: t('Translate Recipe'), path: '/admin/translate_recipe'}} />
    </ul>
  </>
}

const EditRecipeKind = ({id, recipeKinds}) => {
  let recipeKind = recipeKinds.find(k => k.id == id)
  // TODO: Editable image
 
  //const translateRecipeKind = () => {
  //}
  //<button type="button" className="btn btn-primare" onClick={translateRecipeKind}>Translate FR to EN</button>
  
  return <>
    <div className='trunk'>
      <h3>Edit recipe kind</h3>
      <RecipeMediumImage {...{recipe: recipeKind}} />
      <br/><br/>
      <h2>Français</h2>
      <h1 className="ff-satisfy bold fs-25"><TextField model={recipeKind} field='name_fr' style={{width: '100%'}} /></h1>
      <div className="fs-09"><DescriptionTiptap {...{model: recipeKind, json_field: 'json_fr'}} /></div>
      <br/><br/>
      <h2>English</h2>
      <h1 className="ff-satisfy bold fs-25"><TextField model={recipeKind} field='name_en' style={{width: '100%'}} /></h1>
      <div className="fs-09"><DescriptionTiptap {...{model: recipeKind, json_field: 'json_en'}} /></div>
      <br/><br/>
    </div>
  </>
}

const RecipeKindsIndex = ({recipes, recipeKinds, publicUsers, locale}) => {
  const missings = recipes.filter(r => !r.recipe_kind_id)

  const createRecipeKind = (recipe) => {
    window.hcu.createRecord('recipe_kinds', {name_fr: recipe.name, image_slug: recipe.image_slug})
  }
  const destroyRecipeKind = (recipeKind) => {
    if (confirm("Êtes-vous certain de vouloir supprimer cette catégorie définitivement?")) {
      window.hcu.destroyRecord(recipeKind)
    }
  }

  return <>
    <div className='trunk'>
      <h1>Recipe kinds</h1>
      {recipeKinds.map(recipeKind => {
        let name = recipeKind[localeAttr('name', locale)]
        return <div key={recipeKind.id} className='d-flex align-items-center'>
          <Link path={'/admin/ek/'+recipeKind.id} className="plain-link">
            <div className="d-flex align-items-center mb-2">
              <div><RecipeThumbnailImage {...{recipe: recipeKind}} /></div>
              <div className='ms-2'>{name}</div>
            </div>
          </Link>
          <button type='button' className='btn ms-2 btn-sm btn-outline-secondary' onClick={() => destroyRecipeKind(recipeKind)}>Destroy</button>
        </div>
      })}
      <h2>Recipes without categories</h2>
      {missings.map(recipe => {
        let u = publicUsers.find(u => u.id == recipe.user_id)
        return <div key={recipe.id} className="d-flex align-items-center mb-2">
          <div><RecipeThumbnailImage {...{recipe}} /></div>
          <div className='ms-2'>{recipe.name}</div>
          {u ? '' : <div className='error mx-2'>private</div>}
          <button type="button" className="btn btn-primary" onClick={() => createRecipeKind(recipe)}>Créer</button>
        </div>
      })}
    </div>
  </>
}

const AdminPage = ({nbAccounts, nbUsers, publicUsers}) => {

  const [missings, setMissings] = useState(null)

  const backupDb = () => {
    ajax({url: '/backup_db', type: 'POST', success: () => {
      toastr.info("Database backup up successfully.")
    }, error: handleError("Error backing up database.") })
  }
  const matchRecipeKinds = () => {
    ajax({url: '/match_recipe_kinds', type: 'POST', success: () => {
      toastr.info("Recipe kinds matched successfully. Reload page to see changes.")
    }, error: handleError("Error matching recipe kinds.") })
  }
  const translateRecipes = () => {
    ajax({url: '/translate_recipes', type: 'POST', success: ({missings}) => {
      toastr.info("Translate recipes successfull.")
      console.log('missings', missings)
      setMissings(missings)
    }, error: handleError("Error translating recipes.") })
  }
 
  // FIXME: Put translations stuff in another tab...
  let from = 1 // French FIXME
  let to = 4 // English FIXME

  return <>
    <div className="trunk">
      <h1>Dashboard</h1>
      <b>Nb accounts:</b> {nbAccounts}<br/>
      <b>Nb users:</b> {nbUsers}<br/>
      <b>Public users:</b><br/>
      {publicUsers.map(u => <div key={u.id}>{u.name}</div>)}
      <br/><br/><h2>Manual commands</h2>
      <button className="btn btn-primary mx-2" type="button" onClick={backupDb}>Backup database</button>
      <button className="btn btn-primary mx-2" type="button" onClick={translateRecipes}>Translate recipes</button>
      <button className="btn btn-primary mx-2" type="button" onClick={matchRecipeKinds}>Match recipe kinds</button>
      <br/><br/><br/><h2>Output</h2>
      {missings ? <>
        <h3>Missing translations</h3>
        <hr/>
        {missings.map(missing => {
          return <div key={missing}>
            <div className='d-flex justify-content-between'>
              <div style={{width: '49%'}}>
                {missing}
              </div>
              <div style={{width: '49%'}}>
                <TextInput onBlur={(value) => {window.hcu.createRecord('translations', {from: from, to: to, original: missing, translated: value})}} style={{width: '100%'}} />
              </div>
            </div>
            <hr/>
          </div>
        })}
      </> : ''}
    </div>
  </>
}
const TranslationsPage = ({translations}) => {
  return <>
    <h1>Translations page</h1>
    <div className='warning'>TODO: SCOPE BY LANGUAGE</div>
    <hr/>
    {(translations||[]).map(translation => {
      return <div key={translation.id}>
        <div className='d-flex justify-content-between'>
          <div style={{width: '49%'}}>
            <TextField model={translation} field='original' style={{width: '100%'}} />
          </div>
          <div style={{width: '49%'}}>
            <TextField model={translation} field='translated' style={{width: '100%'}} />
          </div>
        </div>
        <hr/>
      </div>
    })}
  </>
}

const SQLPage = () => {
  return <>
    <div className='trunk'>
      <h1>SQL page</h1>
      <textarea style={{width: '100%', height: '20em'}} />
      <button className="btn btn-primary">Execute</button>
      <br/><br/><br/>
      <h6>Exemples:</h6>
      <ul>
        <li>DELETE FROM table_name WHERE id = 0;</li>
        <li>SELECT * FROM table_name WHERE id = 0;</li>
        <li>UPDATE table_name SET name = foo, value = bar, updated_at = ? WHERE id = 0;</li>
        <li>INSERT INTO table_name (created_at, updated_at, name, value) VALUES (?, ?, 'foo', 'bar');</li>
      </ul>
    </div>
  </>
}

const TranslateRecipePage = ({translations, recipes, locale}) => {
  const [recipeId, setRecipeId] = useState(null)
  const [translated, setTranslated] = useState(null)
  const [translationParts, setTranslationParts] = useState(null)

  const recipe = useOrFetchRecipe(recipes, recipeId)
      
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
  const recipeKinds = useHcuState(gon.recipe_kinds, {tableName: 'recipe_kinds'})
  const recipes = useHcuState(gon.recipes||[], {tableName: 'recipes'})
  const [publicUsers,] = useState(gon.public_users||[])
  const [nbUsers,] = useState(gon.nbUsers)
  const [nbAccounts,] = useState(gon.nbAccounts)

  const routes = [
    {match: "/admin/translations", elem: () => <TranslationsPage {...{translations}} />},
    {match: "/admin/sql", elem: () => <SQLPage />},
    {match: "/admin/ki", elem: () => <RecipeKindsIndex {...{recipeKinds, recipes, publicUsers, locale}} />},
    {match: "/admin/ek/:id", elem: ({id}) => <EditRecipeKind {...{id, recipeKinds}} />},
    {match: "/admin/translate_recipe", elem: () => <TranslateRecipePage {...{recipes, locale, translations}} />},
    {match: "/admin", elem: () => <AdminPage {...{nbUsers, nbAccounts, publicUsers}} />},
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
