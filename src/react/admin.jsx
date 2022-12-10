import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import toastr from 'toastr'
//import { createRoot } from 'react-dom/client';

import { TextInput, TextField, CollectionSelect, RangeField, withSelector } from "./form"
import { Link, useOrFetch, getLocale, useCsrf } from "./lib"
import { localeAttr, findRecipeKindForRecipeName, ajax } from "../lib"
import { AppNavbar } from './navbar'
import { ErrorBoundary } from './error_boundary'
import { t } from "../translate"
import { useRouter } from "./router"
import { initHcu, useHcuState, handleError } from '../hcu'
import { RecipeViewer } from "./show_recipe"
import Translator, { TranslationsCacheStrategy, LogStrategy, StoreStrategy } from '../translator'
import { RecipeThumbnailImage, RecipeMediumImage } from "./image"
import { DescriptionTiptap } from "./tiptap"
import {EditRecipeImageModal, EditableImage} from './modals/recipe_image'
import schema from '../schema'
import { HomeTab } from './core'
import { listToTree, sortByDate } from '../utils'
import { changeUrl } from './utils'

const AdminTabs = ({machines}) => {
  return <>
    <ul className="nav nav-tabs mb-3">
      <HomeTab {...{title: t('Admin'), path: '/admin'}} />
      <HomeTab {...{title: t('Errors'), path: '/admin/errors'}} />
      <HomeTab {...{title: t('QA'), path: '/admin/qa'}} />
      <HomeTab {...{title: t('Tree'), path: '/admin/tree'}} />
      <HomeTab {...{title: t('Kinds'), path: '/admin/di'}} />
      <HomeTab {...{title: t('RecipeKinds'), path: '/admin/ki'}} />
      <HomeTab {...{title: t('SQL'), path: '/admin/sql'}} />
      <HomeTab {...{title: t('DB'), path: '/admin/db'}} />
      <HomeTab {...{title: t('Console'), path: '/admin/console'}} />
      <HomeTab {...{title: t('Translations'), path: '/admin/translations'}} />
      <HomeTab {...{title: t('Translate Recipe'), path: '/admin/translate_recipe'}} />
      <HomeTab {...{title: t('CSS'), path: '/admin/css'}} />
    </ul>
  </>
}

const ErrorsPage = ({errors}) => {
  return <>
    <h1>Errors</h1>
    <table className='table table-striped'>
      <thead className='thead-dark'>
        <tr>
          <th>Date</th>
          <th>Url</th>
          <th>Error</th>
          <th>Info</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {(errors||[]).map(error => {
          return <tr key={error.id}>
            <td>{error.created_at}</td>
            <td>{error.url}</td>
            <td>{error.error}</td>
            <td>{error.info}</td>
            <td><button type='button' className='btn btn-primary' onClick={() => window.hcu.destroyRecord(error)}>Clear</button></td>
          </tr>
        })}
      </tbody>
    </table>
  </>
}

const QAPage = ({}) => {
  
  let pages = [
    '/k/51',
    '/d/6',
    '/u/5',
    '/dontExists',
    '/g',
    '/x',
    '/s',
    '/l',
    '/n',
    '/r/1',
    '/e/1',
  ]

  const [page, pageSelector, setPage] = withSelector(pages)

  const previous = () => {
    let i = pages.indexOf(page)
    setPage(i <= 0 ? pages[pages.length-1] : pages[i-1])
  }
  const next = () => {
    let i = pages.indexOf(page)
    setPage(i >= pages.length - 1 ? pages[0] : pages[i+1])
  }

  return <>
    <div className='py-1' style={{position: 'sticky', borderBottom: '1px solid black', top: '0', zIndex: '99999', backgroundColor: 'white'}}>
      <div className='m-auto' style={{width: 'fit-content'}}>
        <button type='button' className='btn btn-sm btn-primary mx-2' onClick={previous}>Previous</button>
        <b>Page:</b> {pageSelector}
        <button type='button' className='btn btn-sm btn-primary mx-2' onClick={next}>Next</button>
      </div>
    </div>
    <h1 className='text-center'>QA</h1>
    <div className='trunk'>
      <br/><br/>
      <h4 className='text-center'>320px</h4>
      <div className="tablet d-none d-sm-block">
        <div className='content' style={{width: '320px', height: '640px'}}>
          <iframe src={page} style={{width: '100%', border: 'none', height: '100%'}}/>
        </div>
      </div>
      <br/><br/><br/><br/><br/><br/>
      <h4 className='text-center'>360px</h4>
      <div className="tablet d-none d-sm-block">
          <div className='content' style={{width: '360px', height: '640px'}}>
          <iframe src={page} style={{width: '100%', border: 'none', height: '100%'}}/>
        </div>
      </div>
      <br/><br/><br/><br/><br/><br/>
      <h4 className='text-center'>575px</h4>
      <div className="tablet d-none d-sm-block">
          <div className='content' style={{width: '575px', height: '760px'}}>
          <iframe src={page} style={{width: '100%', border: 'none', height: '100%'}}/>
        </div>
      </div>
      <br/><br/><br/><br/><br/><br/>
      <h4 className='text-center'>577px</h4>
      <div className="tablet d-none d-sm-block">
          <div className='content' style={{width: '577px', height: '760px'}}>
          <iframe src={page} style={{width: '100%', border: 'none', height: '100%'}}/>
        </div>
      </div>
      <br/><br/><br/><br/><br/><br/>
      <h4 className='text-center'>767px</h4>
      <div className="tablet d-none d-sm-block">
        <div className='content' style={{width: '767px'}}>
          <iframe src={page} style={{width: '100%', border: 'none', height: '100%'}}/>
        </div>
      </div>
      <br/><br/><br/><br/><br/><br/>
      <h4 className='text-center'>769px</h4>
      <div className="tablet d-none d-sm-block">
        <div className='content' style={{width: '769px'}}>
          <iframe src={page} style={{width: '100%', border: 'none', height: '100%'}}/>
        </div>
      </div>
    </div>
    <br/><br/><br/><br/><br/><br/>
    <h4 className='text-center'>991px</h4>
    <div className="laptop d-none d-sm-block">
      <div className='content' style={{width: '991px'}}>
        <iframe src={page} style={{width: '100%', border: 'none', height: '100%'}}/>
      </div>
    </div>
    <br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>
    <h4 className='text-center'>993px</h4>
    <div className="laptop d-none d-sm-block">
      <div className='content' style={{width: '993px'}}>
        <iframe src={page} style={{width: '100%', border: 'none', height: '100%'}}/>
      </div>
    </div>
    <br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>
    <h4 className='text-center'>1199px</h4>
    <div className="laptop d-none d-sm-block">
      <div className='content' style={{width: '1199px'}}>
        <iframe src={page} style={{width: '100%', border: 'none', height: '100%'}}/>
      </div>
    </div>
    <br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>
    <h4 className='text-center'>1201px</h4>
    <div className="laptop d-none d-sm-block">
      <div className='content' style={{width: '1201px'}}>
        <iframe src={page} style={{width: '100%', border: 'none', height: '100%'}}/>
      </div>
    </div>
    <br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>
    <h4 className='text-center'>1399px</h4>
    <div className="laptop d-none d-sm-block">
      <div className='content' style={{width: '1399px'}}>
        <iframe src={page} style={{width: '100%', border: 'none', height: '100%'}}/>
      </div>
    </div>
    <br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>
    <h4 className='text-center'>1401px</h4>
    <div className="laptop d-none d-sm-block">
      <div className='content' style={{width: '1401px'}}>
        <iframe src={page} style={{width: '100%', border: 'none', height: '100%'}}/>
      </div>
    </div>
    <br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>
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

const EditRecipeKind = ({id, recipeKinds, kinds, images, locale}) => {

  let recipeKind = recipeKinds.find(k => k.id == id)
 
  //const translateRecipeKind = () => {
  //}
  //<button type="button" className="btn btn-primare" onClick={translateRecipeKind}>Translate FR to EN</button>
 
  let ids = recipeKinds.map(k => k.id).sort()
  let i = ids.indexOf(recipeKind.id)
  let nextId = (i == ids.length-1 || i==-1) ? null : ids[i+1]

  const averageKind = () => {
    ajax({url: '/average_recipe_kind/'+id, type: 'POST', success: () => {
      toastr.info("Success.")
    }, error: handleError("Fail.") })
  }
  
  return <>
    <div key={id} className='trunk'>
      <h3>Edit recipe kind</h3>
      <EditableImage {...{recipe: recipeKind, images}}/>
      <br/><br/>
      <b>Kind: </b><CollectionSelect model={recipeKind} field="kind_id" options={kinds.map(k => k.id)} showOption={(id) => kinds.find(k => k.id == id)[localeAttr('name', locale)]} includeBlank="true" />
      <br/><br/>
      <h2>Français</h2>
      <h1 className="ff-satisfy bold fs-25"><TextField model={recipeKind} field='name_fr' style={{width: '100%'}} /></h1>
      <div className="fs-09"><DescriptionTiptap {...{model: recipeKind, json_field: 'json_fr'}} /></div>
      <br/><br/>
      <h2>English</h2>
      <h1 className="ff-satisfy bold fs-25"><TextField model={recipeKind} field='name_en' style={{width: '100%'}} /></h1>
      <div className="fs-09"><DescriptionTiptap {...{model: recipeKind, json_field: 'json_en'}} /></div>
      <br/>
      <button type='button' className='btn btn-primary me-2' onClick={averageKind}>Average based on kind</button>
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

  const missings = recipes.filter(r => !r.recipe_kind_id && !findRecipeKindForRecipeName(r.name, recipeKinds))

  const createRecipeKind = (recipe={}) => {
    window.hcu.createRecord('recipe_kinds', {name_fr: recipe.name, image_slug: recipe.image_slug})
  }
  const destroyRecipeKind = (recipeKind) => {
    if (confirm("Êtes-vous certain de vouloir supprimer cette catégorie définitivement?")) {
      window.hcu.destroyRecord(recipeKind)
    }
  }

  const latestFirst = sortByDate(recipeKinds, 'updated_at').slice().reverse()

  return <>
    <div className='trunk'>
      <div className="d-flex gap-15 align-items-center">
        <h1>Recipe Kinds</h1>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={createRecipeKind}>Create recipe kind</button>
      </div>
      {latestFirst.map(recipeKind => {
        let name = recipeKind[localeAttr('name', locale)]
        return <div key={recipeKind.id} className='d-flex align-items-center'>
          <CollectionSelect model={recipeKind} field="kind_id" options={kinds.map(k => k.id)} showOption={(id) => kinds.find(k => k.id == id)[localeAttr('name', locale)]} includeBlank="true" />
          <div className='mx-2'>/</div>
          <Link path={'/admin/ek/'+recipeKind.id} className="plain-link">
            <div className="d-flex align-items-center mb-2">
              <div><RecipeThumbnailImage {...{recipe: recipeKind}} /></div>
              <div className='ms-2'>{name} ({(recipeKind.recipe_count_fr||0)}, {(recipeKind.recipe_count_en||0)})</div>
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

const AdminPage = ({stats, publicUsers, errors}) => {

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
  const updateRecipesLocale = () => {
    ajax({url: '/update_recipes_locale', type: 'POST', success: () => {
      toastr.info("Success")
    }, error: handleError("Fail") })
  }
  const translateRecipes = () => {
    ajax({url: '/translate_recipes', type: 'POST', success: ({missings}) => {
      toastr.info("Translate recipes successfull.")
      console.log('missings', missings)
      setMissings(missings)
    }, error: handleError("Error translating recipes.") })
  }
  const migrateKinds = () => {
    ajax({url: '/migrate_kinds', type: 'POST', success: () => {
      toastr.info("Success")
    }, error: handleError("Failure") })
  }
 
  // FIXME: Put translations stuff in another tab...
  let from = 1 // French FIXME
  let to = 4 // English FIXME

  return <>
    <div className="trunk">
      <h1>Dashboard</h1>
      <b>Errors:</b> <span className={errors.length ? 'red' : 'green'}>{errors.length}</span><br/>
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
      <button className="btn btn-primary m-2" type="button" onClick={updateRecipesLocale}>Update recipes locale</button>
      <button className="btn btn-primary m-2" type="button" onClick={updateKindsCount}>Update kinds count (update locale first)</button>
      <button className="btn btn-primary m-2" type="button" onClick={calcRecipeKinds}>Calc recipe kinds</button>
      <button className="btn btn-primary m-2" type="button" onClick={migrateKinds}>Migrate kinds</button>
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
  const [table, tableSelector] = withSelector(Object.keys(schema).sort(), {includeBlank: true})
  const [column1, setColumn1] = useState('column_a')
  const [column2, setColumn2] = useState('column_b')
  const [addColumn, setAddColumn] = useState('name sum:real')
  const [createTable, setCreateTable] = useState('name sum:real')

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

  let createTableArgs = parseArgs(createTable)
  return <>
    <div className='trunk'>
      <h1>SQL page</h1>
      <textarea style={{width: '100%', height: '20em'}} value={code} onChange={e => setCode(e.target.value)} />
      <button className="btn btn-primary" onClick={executeSQL}>Execute</button>
      <br/><br/><br/>
      <h6>Query generator:</h6>
      <b>TABLE:</b> {tableSelector}<br/>
      <b>COLUMN 1:</b> <input value={column1} onChange={e => setColumn1(e.target.value)} /><br/>
      <b>COLUMN 2:</b> <input value={column2} onChange={e => setColumn2(e.target.value)} /><br/>
      <b>AFFINITIES:</b> INTEGER, TEXT, BLOB, REAL, NUMERIC<br/>
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
      <br/>
      
      <b>CREATE TABLE: </b> <input value={createTable} onChange={e => setCreateTable(e.target.value)} /><br/><br/>
    
      <div>
        CREATE TABLE {table} (<br/>
          &nbsp;&nbsp;id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,<br/>
          &nbsp;&nbsp;created_at     TEXT    NOT NULL,<br/>
          &nbsp;&nbsp;updated_at     TEXT    NOT NULL,<br/>
        {createTableArgs.map(({name, type}, i) => {
          return <div key={name}>&nbsp;&nbsp;{name} {type}{i == createTableArgs.length-1 ? '' : ','}</div>
        })}
        );
      </div>

      <pre>{`
CREATE TABLE table_name(
  id INT PRIMARY KEY     NOT NULL AUTOINCREMENT,
  created_at     TEXT    NOT NULL,
  updated_at     TEXT    NOT NULL
);`}</pre>
    </div>
  </>
}

const TranslateRecipePage = ({translations, recipes, locale}) => {
  const [recipeId, setRecipeId] = useState(null)
  const [translated, setTranslated] = useState(null)
  const [translationParts, setTranslationParts] = useState(null)

  const recipe = useOrFetch('recipes', recipes, r => r.id == recipeId, '/fetch_recipe/'+recipeId, recipeId)
      
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

const CssPage = () => {
  return <div className='trunk'>
    <h1>Sizes</h1>
    <h1>H1</h1>
    <h2>H2</h2>
    <h3>H3</h3>
    <h4>H4</h4>
    <h5>H5</h5>
    <h6>H6</h6>
    <p>Text p</p>
    <h1>Line height</h1>
    <div><b>Bootstrap default line height is 1.5em</b></div>
    <div style={{fontSize: '1em', width: '10em'}}>f-s 1em; width 10em</div>
    <div style={{fontSize: '1em', lineHeight: '1em'}}>f-s 1em; line-height 1em</div>
    <div style={{fontSize: '1em', lineHeight: '2em'}}>f-s 1em; line-height 2em</div>
    <div style={{fontSize: '20px', width: '200px'}}>f-s 20px; width 200px</div>

    <br/><br/>
    <p>Use em a lot. Don't set the font-size of body. Let the device set it. This way it is always readable.</p>
    <p>Use rem to set margins and paddings, because they change based on element font size. When you write fontSize: 2em, then padding 1em will actually be 2em...</p>

    <p>
      em: Relative to font height<br/>
      ex: Relative to font height of lowercase «x»<br/>
      px: 1 px is a sharp line (use for border only?)<br/>
    </p>
  </div>
}

const DbPage = () => {

  //const [table, setTable] = useState('table_name')
  const [table, tableSelector] = withSelector(Object.keys(schema).sort(), {includeBlank: true})
  const [data, setData] = useState(null)

  useEffect(() => {
    if (table) {
      ajax({url: '/fetch_all/'+table, type: 'GET', success: (rows) => {
        setData(rows)
      }})
    }
  }, [table])

  let columns = Object.keys(data?.at(0)||{})

  const updateField = (row, field, value) => {
    if (row[field] != value) {
      let data = {field, value}
      ajax({url: '/update_field/'+table+'/'+row.id, type: 'PATCH', data: data, success: () => {
        toastr.info("Changes successfull.")
      }, error: handleError(t('Error_updating')) })
    }
  }

  return <>
    <h1>DB</h1>
    <b>TABLE: </b> {tableSelector}
    <br/>
    <table key={table} className='table table-striped'>
      <thead className='thead-dark'>
        <tr>
          {columns.map(c => <th key={c}>{c}</th>)}
        </tr>
      </thead>
      <tbody>
        {(data||[]).map(row => {
          return <tr key={row.id}>
            {columns.map(c => {
              if (c == 'id' || c == 'updated_at' || c == 'created_at') {
                return <td key={c}>{row[c]}</td>
              } else {
                return <td key={c}><input defaultValue={row[c]} type='text' onBlur={(e) => {updateField(row, c, e.target.value)}} /></td>
              }
            })}
          </tr>
        })}
      </tbody>
    </table>
  </>
}

const KindMenu = ({kind}) => {

  const destroyRecipeKind = () => {
    if (confirm("Êtes-vous certain de vouloir supprimer cette catégorie définitivement?")) {
      window.hcu.destroyRecord(kind)
    }
  }

  //<button type="button" className="dropdown-item" onClick={() => editUserRecipe(recipe)}>{t('Tag')}</button>
  return <>
    <div className="dropdown">
      <button className="plain-btn mx-2 float-end" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
        <img width="24" src="/icons/three-dots.svg"/>
      </button>
      <div className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
        <button type="button" className="dropdown-item" onClick={destroyRecipeKind}>{t('Delete')}</button>
      </div>
    </div>
  </>
}

const KindNode = ({node, depth}) => {
  return <div key={node.id}>
    <div className="position-relative" style={{marginLeft: depth*4+'em'}}>
      {depth <= 0 ? null : <>
        {[...Array(depth).keys()].map(i => (
          <div key={i} className="position-absolute" style={{height: '4em', width: '1px', background: 'repeating-linear-gradient(0deg,black 0 5px,#0000 0 7px)', left: '-'+(2+4*i)+'em', top: '-2.5em'}}></div>
        ))}
        <div className="position-absolute" style={{height: '1px', width: '35.5px', background: 'repeating-linear-gradient(90deg,black 0 5px,#0000 0 7px)', left: '-2em', top: '23px'}}></div>
      </>}
      <div className="d-flex align-items-center my-2 p-1 position-relative" style={{border: '1px solid black', width: 'fit-content', minWidth: '20em', background: 'white', borderRadius: '4px'}}>
        <div className="flex-grow-1" style={{zIndex: '1'}}>
          <Link path={'/admin/ek/'+node.id} style={{textDecoration: 'none', color: 'black'}}>
            <div className="d-flex align-items-center">
              <RecipeThumbnailImage recipe={node} />
              <div style={{width: '0.5em'}}></div>
              <div>{node.name_fr}</div>
            </div>
          </Link>
        </div>
        <div><KindMenu kind={node} /></div>
      </div>
    </div>
    {node.children.map(child => <KindNode key={child.id} node={child} depth={depth+1} />)}
  </div>
}

const TreePage = ({recipeKinds}) => {
  let latestFirst = sortByDate(recipeKinds, 'updated_at').slice().reverse()
  let tree = listToTree(latestFirst, 'kind_id')
  
  const createRecipeKind = (recipe={}) => {
    window.hcu.createRecord('recipe_kinds', {name_fr: recipe.name, image_slug: recipe.image_slug}, (record) => {
      changeUrl('/admin/ek/'+record.id)
    })
  }

  return <div style={{background: 'rgb(252, 253, 254)'}}>
    <div className="trunk">
      <div className="d-flex gap-15 align-items-center">
        <h1>Recipe Kinds</h1>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={createRecipeKind}>Create</button>
      </div>
      {tree.map(root => <KindNode key={root.id} node={root} depth={0} />)}
    </div>
  </div>
}

const Redirect = ({url}) => {useEffect(() => {window.location.href = url}); return null}

export const Admin = () => {
  
  if (!window.hcu) {initHcu()}

  const locale = getLocale()
  const translations = useHcuState(gon.translations, {tableName: 'translations'})
  const recipeKinds = useHcuState(gon.recipe_kinds, {tableName: 'recipe_kinds'})
  const recipes = useHcuState(gon.recipes||[], {tableName: 'recipes'})
  const kinds = useHcuState(gon.kinds, {tableName: 'kinds'})
  const images = useHcuState(gon.images||[], {tableName: 'images'})
  const [user,] = useState(gon.user)
  const [siblings,] = useState(gon.siblings)
  const errors = useHcuState(gon.errors||[], {tableName: 'errors'})
  const [publicUsers,] = useState(gon.public_users||[])
  const [stats,] = useState(gon.stats)

  const routes = [
    {match: "/admin/translations", elem: () => <TranslationsPage {...{translations}} />},
    {match: "/admin/sql", elem: () => <SQLPage />},
    {match: "/admin/qa", elem: () => <QAPage />},
    {match: "/admin/errors", elem: () => <ErrorsPage {...{errors}} />},
    {match: "/admin/tree", elem: () => <TreePage {...{kinds, recipeKinds}} />},
    {match: "/admin/db", elem: () => <DbPage />},
    {match: "/admin/css", elem: () => <CssPage />},
    {match: "/admin/console", elem: () => <Console />},
    {match: "/admin/ki", elem: () => <RecipeKindsIndex {...{recipeKinds, recipes, publicUsers, locale, kinds}} />},
    {match: "/admin/di", elem: () => <KindsIndex {...{kinds, recipeKinds, locale}} />},
    {match: "/admin/ek/:id", elem: ({id}) => <EditRecipeKind {...{id, recipeKinds, images, kinds, locale}} />},
    {match: "/admin/ed/:id", elem: ({id}) => <EditKind {...{id, kinds}} />},
    {match: "/admin/translate_recipe", elem: () => <TranslateRecipePage {...{recipes, locale, translations}} />},
    {match: "/admin", elem: () => <AdminPage {...{stats, publicUsers, errors}} />},
    {match: "/", elem: () => <Redirect url='/' />},
  ]
  const defaultElement = (params) => <TranslationsPage />
  
  const {elem,idx} = useRouter(routes, defaultElement)
  const _csrf = useCsrf()
  
  return <>
    <AppNavbar {...{locale, _csrf, recipes, recipeKinds, user, siblings}} />
    <div style={{padding: '0 0.5em'}}>
      <AdminTabs />
      <ErrorBoundary key={idx}>
        {elem}
      </ErrorBoundary>
    </div>
    <br/><br/><br/><br/><br/><br/><br/><br/>
  </>
}

root = document.getElementById('root-admin')
if (root) {ReactDOM.render(<Admin />, root)}
