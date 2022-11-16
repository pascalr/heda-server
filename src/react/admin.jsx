import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import toastr from 'toastr'
//import { createRoot } from 'react-dom/client';

import { TextInput, TextField, CollectionSelect, RangeField } from "./form"
import { Link, useOrFetchRecipe, getLocale } from "./lib"
import { localeAttr } from "../lib"
import { MainSearch } from './main_search'
import { HomeTab, AppErrorBoundary } from './app'
import { t } from "../translate"
import { useRouter } from "./router"
import { initHcu, useHcuState, handleError } from '../hcu'
import { RecipeViewer } from "./show_recipe"
import { ajax } from "./utils"
import Translator, { TranslationsCacheStrategy, LogStrategy, StoreStrategy } from '../translator'
import { RecipeThumbnailImage, RecipeMediumImage } from "./image"
import { DescriptionTiptap } from "./tiptap"
import {EditRecipeImageModal, EditableImage} from './modals/recipe_image'
import schema from '../schema'

const AdminTabs = ({machines}) => {
  return <>
    <ul className="nav nav-tabs mb-3">
      <HomeTab {...{title: t('Admin'), path: '/admin'}} />
      <HomeTab {...{title: t('Kinds'), path: '/admin/di'}} />
      <HomeTab {...{title: t('RecipeKinds'), path: '/admin/ki'}} />
      <HomeTab {...{title: t('SQL'), path: '/admin/sql'}} />
      <HomeTab {...{title: t('DB'), path: '/admin/db'}} />
      <HomeTab {...{title: t('Console'), path: '/admin/console'}} />
      <HomeTab {...{title: t('Translations'), path: '/admin/translations'}} />
      <HomeTab {...{title: t('Translate Recipe'), path: '/admin/translate_recipe'}} />
    </ul>
  </>
}

const EditKind = ({id, kinds}) => {
  let kind = kinds.find(k => k.id == id)
  
  return <>
    <div className='trunk'>
      <h3>Edit kind</h3>
      <h2>Français</h2>
      <h1 className="ff-satisfy bold fs-25"><TextField model={kind} field='name_fr' style={{width: '100%'}} /></h1>
      <h2>English</h2>
      <h1 className="ff-satisfy bold fs-25"><TextField model={kind} field='name_en' style={{width: '100%'}} /></h1>
    </div>
  </>
}

const EditRecipeKind = ({id, recipeKinds, images}) => {

  let recipeKind = recipeKinds.find(k => k.id == id)
 
  //const translateRecipeKind = () => {
  //}
  //<button type="button" className="btn btn-primare" onClick={translateRecipeKind}>Translate FR to EN</button>
 
  let ids = recipeKinds.map(k => k.id).sort()
  let i = ids.indexOf(recipeKind.id)
  let nextId = (i == ids.length-1 || i==-1) ? null : ids[i+1]
  
  return <>
    <div key={id} className='trunk'>
      <h3>Edit recipe kind</h3>
      <EditableImage {...{recipe: recipeKind, images}}/>
      <br/><br/>
      <h2>Français</h2>
      <h1 className="ff-satisfy bold fs-25"><TextField model={recipeKind} field='name_fr' style={{width: '100%'}} /></h1>
      <div className="fs-09"><DescriptionTiptap {...{model: recipeKind, json_field: 'json_fr'}} /></div>
      <br/><br/>
      <h2>English</h2>
      <h1 className="ff-satisfy bold fs-25"><TextField model={recipeKind} field='name_en' style={{width: '100%'}} /></h1>
      <div className="fs-09"><DescriptionTiptap {...{model: recipeKind, json_field: 'json_en'}} /></div>
      <br/>
      <br/><h6>Kind of food</h6>
      <b>Appetizer: </b><RangeField model={recipeKind} field='is_appetizer' min="0" max="1" step="0.1" /><br/>
      <b>Meal: </b><RangeField model={recipeKind} field='is_meal' min="0" max="1" step="0.1" /><br/>
      <b>Dessert: </b><RangeField model={recipeKind} field='is_dessert' min="0" max="1" step="0.1" /><br/>
      <b>Other: </b><RangeField model={recipeKind} field='is_other' min="0" max="1" step="0.1" /><br/>
      <br/><h6>Quantity</h6>
      <b>Small: </b><RangeField model={recipeKind} field='is_small_qty' min="0" max="1" step="0.1" /><br/>
      <b>Medium: </b><RangeField model={recipeKind} field='is_medium_qty' min="0" max="1" step="0.1" /><br/>
      <b>Big: </b><RangeField model={recipeKind} field='is_big_qty' min="0" max="1" step="0.1" /><br/>
      <br/><h6>Difficulty</h6>
      <b>Simple: </b><RangeField model={recipeKind} field='is_simple' min="0" max="1" step="0.1" /><br/>
      <b>Normal: </b><RangeField model={recipeKind} field='is_normal' min="0" max="1" step="0.1" /><br/>
      <b>Gourmet: </b><RangeField model={recipeKind} field='is_gourmet' min="0" max="1" step="0.1" /><br/>
      <br/><h6>Speed</h6>
      <b>Very fast (now): </b><RangeField model={recipeKind} field='is_very_fast' min="0" max="1" step="0.1" /><br/>
      <b>Fast (latter): </b><RangeField model={recipeKind} field='is_fast' min="0" max="1" step="0.1" /><br/>
      <br/><br/>
      {i != 0 ? <Link className='btn btn-primary me-2' path={'/admin/ek/'+ids[i-1]}>Previous</Link> : null}
      {nextId ? <Link className='btn btn-primary me-2' path={'/admin/ek/'+nextId}>Next</Link> : null}
    </div>
  </>
}

const KindsIndex = ({kinds, recipeKinds, locale}) => {

  const createKind = (kind) => {
    window.hcu.createRecord('kinds', {})
  }
  const destroyKind = (kind) => {
    if (confirm("Êtes-vous certain de vouloir supprimer cette catégorie définitivement?")) {
      window.hcu.destroyRecord(kind)
    }
  }

  return <>
    <div className='trunk'>
      <div className="d-flex gap-15 align-items-center">
        <h1>Kinds</h1>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={createKind}>Create kind</button>
      </div>
      {kinds.map(kind => {
        let name = kind[localeAttr('name', locale)] || 'Untitled'
        return <div key={kind.id} className='d-flex align-items-center'>
          <CollectionSelect model={kind} field="kind_id" options={kinds.map(k => k.id)} showOption={(id) => kinds.find(k => k.id == id)[localeAttr('name', locale)]} includeBlank="true" />
          <div className='mx-2'>/</div>
          <Link path={'/admin/ed/'+kind.id} className="plain-link">
            <div>{name}</div>
          </Link>
          <button type='button' className='btn ms-2 btn-sm btn-outline-secondary' onClick={() => destroyKind(kind)}>Destroy</button>
        </div>
      })}
    </div>
  </>
}

const RecipeKindsIndex = ({recipes, recipeKinds, publicUsers, locale, kinds}) => {
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
          <CollectionSelect model={recipeKind} field="kind_id" options={kinds.map(k => k.id)} showOption={(id) => kinds.find(k => k.id == id)[localeAttr('name', locale)]} includeBlank="true" />
          <div className='mx-2'>/</div>
          <Link path={'/admin/ek/'+recipeKind.id} className="plain-link">
            <div className="d-flex align-items-center mb-2">
              <div><RecipeThumbnailImage {...{recipe: recipeKind}} /></div>
              <div className='ms-2'>{name} ({recipeKind.recipe_count || 0})</div>
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

const AdminPage = ({stats, publicUsers}) => {

  const [missings, setMissings] = useState(null)

  const updateKindsCount = () => {
    ajax({url: '/update_kinds_count', type: 'POST', success: () => {
      toastr.info("Update kinds count successfull.")
    }, error: handleError("Error updating kinds count.") })
  }
  const backupDb = () => {
    ajax({url: '/backup_db', type: 'POST', success: () => {
      toastr.info("Database backup up successfully.")
    }, error: handleError("Error backing up database.") })
  }
  const calcRecipeKinds = () => {
    ajax({url: '/calc_recipe_kinds', type: 'POST', success: () => {
      toastr.info("Success.")
    }, error: handleError("Failure.") })
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
      <b>Nb accounts:</b> {stats.nbAccounts}<br/>
      <b>Nb daily visits total:</b> {stats.nbDailyVisitsTotal}<br/>
      <b>Nb requests total:</b> {stats.nbRequestsTotal}<br/>
      <b>Nb users:</b> {stats.nbUsers}<br/>
      <b>Public users:</b><br/>
      {publicUsers.map(u => <div key={u.id}>{u.name}</div>)}
      <br/><br/><h2>Manual commands</h2>
      <button className="btn btn-primary m-2" type="button" onClick={backupDb}>Backup database</button>
      <button className="btn btn-primary m-2" type="button" onClick={translateRecipes}>Translate recipes</button>
      <button className="btn btn-primary m-2" type="button" onClick={matchRecipeKinds}>Match recipe kinds</button>
      <button className="btn btn-primary m-2" type="button" onClick={updateKindsCount}>Update kinds count</button>
      <button className="btn btn-primary m-2" type="button" onClick={calcRecipeKinds}>Calc recipe kinds</button>
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

const SelectTableName = () => {
 return <CollectionSelect field="table_name" options={Object.keys(schema)} showOption={n => n} onChange={() => {}} />
}

const Console = () => {
  
  const [cmd, setCmd] = useState('')
  const [output, setOutput] = useState([])
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current.focus()

    Object.keys(schema).forEach(table => {
      window[table] = {}
      window[table].all = () => new Promise(function(resolve, reject) {
        ajax({url: '/fetch_all/'+table, type: 'GET', success: (rows) => {
          resolve(rows)
        }, error: () => {reject()} })
      })
      window[table].find = (id) => new Promise(function(resolve, reject) {
        ajax({url: '/fetch_single/'+table+'/'+id, type: 'GET', success: (row) => {
          resolve(row)
        }, error: () => {reject()} })
      })
    })
  }, [])
  useEffect(() => {
    inputRef.current.scrollIntoView(false)
  }, [cmd, output])

  function submitCommand(evt) {
    evt.preventDefault()

    try {
      var eval2 = eval // To avoid direct eval with bundler
      Promise.resolve(eval2(cmd)).then(result => {
        setOutput([...output, '> '+cmd, result])
        window._ = result
      })
    } catch (err) {
      setOutput([...output, '> '+cmd, ''+err])
    }
    setCmd('')
  }

  return <>
    <div className='trunk'>
      <h1>Console</h1>
      <div id='console' style={{border: '1px solid black', maxHeight: '75vh', overflowY: 'scroll'}} className='p-2'>
        {output.map((e,i) => {
          let style = i % 2 === 1 ? {color: 'red'} : {}
          if (typeof e === 'function') {
            return <pre key={i} style={style}>[Function]</pre>
          } else if (typeof e === 'object') {
            return <pre key={i} style={style}>{JSON.stringify(e, null, 2)}</pre>
          }
          return <pre key={i} style={style}>{e}</pre>
        })}
        <form onSubmit={submitCommand}>
          <div className='d-flex'>
            <span className='me-1'>&gt;</span>
            <input type="text" value={cmd} onChange={(e) => setCmd(e.target.value)} className='flex-grow-1 plain-input' ref={inputRef} />
            <button type="submit" className='d-none' />
          </div>
        </form>
      </div>
      <br/><p>Note: Use «_» to get the last value.</p>
    </div>
  </>
}

const SQLPage = () => {

  const [code, setCode] = useState('')
  const [table, setTable] = useState('table_name')
  const [column1, setColumn1] = useState('column_a')
  const [column2, setColumn2] = useState('column_b')
  const [addColumn, setAddColumn] = useState('name sum:real')

  function executeSQL() {
    if (confirm("Êtes-vous certain de vouloir exécuter ce code SQL?")) {
      ajax({url: '/exe_sql', type: 'POST', data: {code}, success: () => {
        toastr.info("Migration successfull.")
      }, error: handleError("Error executing migration.") })
    }
  }

  function parseArgs(raw) {
    if (!raw) {return []}
    return raw.split(' ').map(a => {
      let s = a.split(':')
      return {name: s[0], type: (s[1]||'TEXT').toUpperCase()}
    })
  }

  return <>
    <div className='trunk'>
      <h1>SQL page</h1>
      <textarea style={{width: '100%', height: '20em'}} value={code} onChange={e => setCode(e.target.value)} />
      <button className="btn btn-primary" onClick={executeSQL}>Execute</button>
      <br/><br/><br/>
      <h6>Query generator:</h6>
      <b>TABLE:</b> <input value={table} onChange={e => setTable(e.target.value)} /><br/>
      <b>COLUMN 1:</b> <input value={column1} onChange={e => setColumn1(e.target.value)} /><br/>
      <b>COLUMN 2:</b> <input value={column2} onChange={e => setColumn2(e.target.value)} /><br/>
      <b>TYPES:</b> INTEGER, TEXT, BLOB, REAL, NUMERIC<br/>
      <h6>Exemples:</h6>
      <ul>
        <li>DELETE FROM {table} WHERE id = 0;</li>
        <li>SELECT * FROM {table} WHERE id = 0;</li>
        <li>UPDATE {table} SET name = foo, value = bar, updated_at = ? WHERE id = 0;</li>
        <li>UPDATE users SET locale = 'en' WHERE locale IS NULL;</li>
        <li>INSERT INTO {table} (created_at, updated_at, name, value) VALUES (?, ?, 'foo', 'bar');</li>
        <li>ALTER TABLE {table} ADD COLUMN column_name_a TEXT NULL;</li>
        <li>(INTEGER, TEXT, BLOB, REAL, NUMERIC)</li>
        <li>ALTER TABLE: https://www.sqlite.org/lang_altertable.html</li>
        <li>
          <b>Change column constraints:</b><br/>
          ALTER TABLE {table} ADD COLUMN {column2} TEXT NOT NULL DEFAULT('en');<br/>
          UPDATE {table} SET {column2} = {column1};<br/>
          ALTER TABLE {table} DROP COLUMN {column1};<br/>
          ALTER TABLE {table} RENAME COLUMN {column2} TO {column1};<br/>
        </li>
      </ul>
      <b>ADD COLUMNS: </b> <input value={addColumn} onChange={e => setAddColumn(e.target.value)} /><br/><br/>
      {parseArgs(addColumn).map(({name, type}) => {
        return <div key={name}>ALTER TABLE {table} ADD COLUMN {name} {type};</div>
      })}
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

const DbPage = () => {

  const [table, setTable] = useState('table_name')
  const [data, setData] = useState(null)

  useEffect(() => {
    ajax({url: '/fetch_all/'+table, type: 'GET', success: (rows) => {
      console.log('rows', rows)
      setData(rows)
    }})
  }, [table])

  let columns = Object.keys(data?.at(0)||{})

  return <>
    <h1>DB</h1>
    <b>TABLE: </b> <input value={table} onChange={e => setTable(e.target.value)} /><br/>
    <table className='table table-striped'>
      <thead className='thead-dark'>
        <tr>
          {columns.map(c => <th key={c}>{c}</th>)}
        </tr>
      </thead>
      <tbody>
        {(data||[]).map(row => {
          return <tr key={row.id}>
            {columns.map(c => <td key={c}>{row[c]}</td>)}
          </tr>
        })}
      </tbody>
    </table>
  </>
}

export const Admin = () => {
  
  if (!window.hcu) {initHcu()}

  const locale = getLocale()
  const translations = useHcuState(gon.translations, {tableName: 'translations'})
  const recipeKinds = useHcuState(gon.recipe_kinds, {tableName: 'recipe_kinds'})
  const recipes = useHcuState(gon.recipes||[], {tableName: 'recipes'})
  const kinds = useHcuState(gon.kinds, {tableName: 'kinds'})
  const images = useHcuState(gon.images||[], {tableName: 'images'})
  const [publicUsers,] = useState(gon.public_users||[])
  const [stats,] = useState(gon.stats)

  const routes = [
    {match: "/admin/translations", elem: () => <TranslationsPage {...{translations}} />},
    {match: "/admin/sql", elem: () => <SQLPage />},
    {match: "/admin/db", elem: () => <DbPage />},
    {match: "/admin/console", elem: () => <Console />},
    {match: "/admin/ki", elem: () => <RecipeKindsIndex {...{recipeKinds, recipes, publicUsers, locale, kinds}} />},
    {match: "/admin/di", elem: () => <KindsIndex {...{kinds, recipeKinds, locale}} />},
    {match: "/admin/ek/:id", elem: ({id}) => <EditRecipeKind {...{id, recipeKinds, images}} />},
    {match: "/admin/ed/:id", elem: ({id}) => <EditKind {...{id, kinds}} />},
    {match: "/admin/translate_recipe", elem: () => <TranslateRecipePage {...{recipes, locale, translations}} />},
    {match: "/admin", elem: () => <AdminPage {...{stats, publicUsers}} />},
  ]
  const defaultElement = (params) => <TranslationsPage />
  
  const {elem,idx} = useRouter(routes, defaultElement)
  
  return <>
    <MainSearch {...{locale}} />
    <div style={{padding: '0 0.5em'}}>
      <AdminTabs/>
      <AppErrorBoundary key={idx}>
        {elem}
      </AppErrorBoundary>
    </div>
    <br/><br/><br/><br/><br/><br/><br/><br/>
  </>
}

root = document.getElementById('root-admin')
if (root) {ReactDOM.render(<Admin />, root)}
