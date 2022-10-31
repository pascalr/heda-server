import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
//import { createRoot } from 'react-dom/client';

import { useCacheOrFetch, useCacheOrFetchHTML, useWindowWidth, Link } from "./lib"
import { findRecipeKindForRecipeName } from "../lib"
import { RecipeList, RecipeIndex } from './recipe_index'
import { changeUrl, ajax, isBlank, normalizeSearchText, preloadImage, join, bindSetter, capitalize, isTrue } from "./utils"
import { getUrlParams, sortBy, shuffle, queryToParams } from "../utils"
import { icon_path, image_path, image_slug_variant_path, recipePath } from './routes'
import {TextField, AutocompleteInput, TextInput, CollectionSelect, ImageField, ImageSelector} from './form'
import { DeleteConfirmButton } from './components/delete_confirm_button'
import {RecipeEditor} from "./recipe_editor"
import {RecipeViewer} from "./recipe_viewer"
import { initHcu, useHcuState } from '../hcu'
import { RecipeThumbnailImage, RecipeSmallImage, RecipeMediumImage } from "./image"
import { t } from "../translate"
import { Carrousel } from './carrousel'
import {EditMix} from './recipe_editor'
import { AppSearch } from './main_search'

import { match } from "path-to-regexp"

// The advantage of using this instead of the number is if I need to search and to refactor, I can easy
const PAGE_1 = 1 // HomePage, TagIndex no more
const PAGE_2 = 2 // TagCategorySuggestions
const PAGE_3 = 3 // EditTag
const PAGE_4 = 4 // EditTags
//const PAGE_5 = 5 // TrainFilter
const PAGE_6 = 6 // MyRecipes
const PAGE_7 = 7 // MyBooks
const PAGE_8 = 8 // TagEditAllCategories
const PAGE_9 = 9 // SuggestionsIndex
const PAGE_10 = 10 // HedaIndex
const PAGE_11 = 11 // Inventory
const PAGE_12 = 12 // MixIndex
const PAGE_13 = 13 // ShowMix
const PAGE_14 = 14 // EditMix
const PAGE_15 = 15 // ShowRecipe
const PAGE_16 = 16 // EditRecipe
const PAGE_17 = 17 // NewRecipe
const PAGE_18 = 18
const PAGE_19 = 19
const PAGE_20 = 20

const changePage = (page) => {
  window.hcu.changePage(page)
  //getRegister('setPage')(page)
}
  

const EditTag = ({page, tags}) => {
  const [name, setName] = useState('')
  //const filter = page && page.filterId ? recipeFilters.find(f => f.id == page.filterId) : null
  const tag = page && page.tagId ? tags.find(f => f.id == page.tagId) : null
  if (!tag) {console.log("Can't edit tag, did not exist."); return '';}
  
  return (<>
    <h2>{t('Modify_tag')}</h2>
    <h3>{t('Name')}</h3>
    <TextField model={tag} field="name" />
    <br/><br/>
    <Link path='/c' className="btn btn-primary">Ok</Link>
  </>)
}

const EditTagButton = ({tag}) => {
  return (
    <div className="d-flex align-items-center" style={{padding: '5px 0'}}>
      <img src='/icons/arrows-move.svg' width="20" height="20" />
      <div className="me-3"/>
      <Link path={'/t/'+tag.id}>
        <b>{tag.name || t("No_name")}</b>
      </Link>
      <div className="me-3"/>
      <DeleteConfirmButton id={`del-user-tag-${tag.id}`} onDeleteConfirm={() => window.hcu.destroyRecord(tag)} message="Je veux retirer cette étiquette?" />
    </div>
  )
}
const EditTags = ({tags, page, machines}) => {

  //userTags = sortBy(userTags, "position") Not necessary, done on server side
  const [orderedTags, setOrderedTags] = useState(tags)

  useEffect(() => {
    setOrderedTags(sortBy(tags, 'position'))
  }, [tags])

  const tagsC= orderedTags.map((tag, index) => {
    return <Draggable key={`drag-user-tag-${tag.id}`} draggableId={`drag-user-tag-${tag.id.toString()}`} index={index}>
      {(provided) => (<>
        <div className="item-container" ref={provided.innerRef} {...provided.dragHandleProps} {...provided.draggableProps}>
          <EditTagButton {...{tag}} />
        </div>
      </>)}
    </Draggable>
  })

  const handleDrop = ({source, destination, type, draggableId}) => {
    if (!destination) return; // Ignore drop outside droppable container
    
    let userTagId = draggableId.substr(14) // removes "drag-user-tag-"
    console.log('userTagId', userTagId)

    var updatedList = [...orderedTags];
    const [reorderedItem] = updatedList.splice(source.index, 1);
    updatedList.splice(destination.index, 0, reorderedItem);

    setOrderedTags(updatedList)

    let mods = []
    updatedList.forEach((item,i) => {
      if (item.position != i) {
        mods.push({method: 'UPDATE', tableName: item.table_name, id: item.id, field: "position", value: i})
      }
    })
    window.hcu.batchModify(mods)
  }

  const createTag = () => {
    window.hcu.createRecord('tags', {}, (tag) => {
      changeUrl('/t/'+tag.id)
    })
  }

  return (<>
    <HomeTabs {...{page, machines}} />
    <div className="d-flex gap-15 align-items-center">
      <h2>{t('Tags')}</h2>
      <button type="button" className="btn btn-outline-primary btn-sm" onClick={createTag}>{t('Create_tag')}</button>
    </div>
    <DragDropContext onDragEnd={handleDrop}>
      <Droppable droppableId="user-tags-container">
        {(provided) => (<>
          <div className="user-tags-container" {...provided.droppableProps} ref={provided.innerRef}>
            {tagsC}
            {provided.placeholder}
          </div>
        </>)}
      </Droppable>
    </DragDropContext>
  </>)
}

const TagButton = ({title, image, handleClick}) => {
  return (
    <div style={{width: '200px', padding: '25px', display: "inline-block"}}>
      <button className="plain-btn d-flex flex-column align-items-center" onClick={handleClick}>
        <img src={image} width="150" height="150" />
        <b>{title}</b>
      </button>
    </div>
  )
}

const HomeTab = ({isActive, title, path}) => {
  return <>
    <li className="nav-item">
      <Link {...{path, className: 'nav-link', active: isActive}}>{title}</Link>
    </li>
  </>
}
const HomeTabs = ({page, machines}) => {
  const currentPage = page.page
  return <>
    <ul className="nav nav-tabs mb-3">
      <HomeTab {...{isActive: currentPage == PAGE_1 || !page.page, title: 'Suggestions', path: '/'}} />
      <HomeTab {...{isActive: currentPage == PAGE_6, title: 'Mes recettes', path: '/l'}} />
      <HomeTab {...{isActive: currentPage == PAGE_4, title: 'Paramètres', path: '/c'}} />
      {machines.map((machine) => (
        <HomeTab key={'m'+machine.id} {...{isActive: false, title: machine.name, path: '/m/'+machine.id}} />
      ))}
    </ul>
  </>
}

const RecipeCarrousel = ({items}) => {
  const preloadItem = (i) => {if (i.image_slug) {preloadImage('/imgs/small/'+i.image_slug)}}
  return <>
    <Carrousel {...{items, preloadItem, maxItems: 3}}>{item => <>
      <Link {...{className: 'plain-link', path: recipePath(item)}}>
        <RecipeSmallImage {...{recipe: item}} />
        <div className="mt-1 mb-3" style={{lineHeight: 1}}>{item.name}</div>
      </Link>
    </>}</Carrousel>
  </>
}

const HomePage = ({page, tags, recipes, suggestions, favoriteRecipes, machines}) => {

  //let favList = {title: t("Favorites"), records: []}
  let toCookList = {title: t('To_cook_soon'), records: []}
  let toTryList = {title: t('To_try'), records: []}
  favoriteRecipes.forEach(fav => {
    let recipe = recipes.find(r => r.id == fav.recipe_id)
    if (fav.list_id == 1) { toCookList.records.push({recipe, fav}) }
    else if (fav.list_id == 2) { toTryList.records.push({recipe, fav}) }
    //else { favList.records.push({recipe, fav}) }
  })
  const lists = [toCookList, toTryList]
  //const lists = [toCookList, favList, toTryList]

  let suggestionsByTagId = suggestions.reduce((acc, suggestion) => {
    let prev = acc[suggestion.tag_id]
    acc[suggestion.tag_id] = !prev ? [suggestion] : [...prev, suggestion]
    return acc
  }, {})
  const sTags = sortBy(tags, "position")

  return <>
    <HomeTabs {...{page, machines}} />
    {lists.map(list => {
      if (list.records.length <= 0) {return ''}
      return <div key={list.title}>
        <h2 className="fs-14 bold">{list.title}</h2>
        <RecipeCarrousel {...{items: list.records.map(r => r.recipe)}}/>
      </div>
    })}
    {sTags.map(tag => {
      if (!suggestionsByTagId[tag.id]) {return ''}
      const unsortedItems = suggestionsByTagId[tag.id].map(sugg => recipes.find(r => r.id == sugg.recipe_id))
      const itemsWithImages = unsortedItems.filter(r => r.image_slug)
      const itemsWithoutImages = unsortedItems.filter(r => !r.image_slug)
      const items = [...shuffle(itemsWithImages), ...shuffle(itemsWithoutImages)]
      return <div key={tag.id}>
        <h2 className="fs-14 bold">{tag.name}</h2>
        <RecipeCarrousel {...{items}}/>
      </div>
    })}
  </> 
}

// I do something similar to Tiptap to serialize and deserialize
const CmdAdd = {
  id: 'ADD',
  label: {
    fr: 'AJOUTER'
  },
  args: [ // unused
    {name: 'qty', type: 'STRING'},
    {name: 'food', type: 'REFERENCE'}, // 'idNumber-name'
  ],
  // ADD,qty,machineFoodId,foodName
  parse: (args, context, obj={}) => {
    obj.qty = args[1]
    if (args[2]) {
      let i = args[2].indexOf('-')
      obj.machineFoodId = (i == -1) ? null : args[2].substr(0,i)
      obj.machineFoodName = (i == -1) ? args[2] : args[2].substr(i+1)
      obj.machineFood = context.machineFoods.find(e => e.id == obj.machineFoodId)
    }
    if (!obj.machineFood) {
      obj.errors = [`Unable to find food with name = ${args[2]}`]
    }
    return obj
  },
  print: (obj) => {
      return <div className="instruction"><span>{obj.type.label.fr}</span><span>{obj.qty}</span><span>{obj.machineFoodName}</span></div>
  },
}
const CmdMix = {
  id: 'MIX',
  label: {
    fr: 'MÉLANGER'
  },
  parse: (args, context, obj={}) => {
    return obj
  },
  print: (obj) => {
    return <div className="instruction"><span>{obj.type.label.fr}</span></div>
  },
}
const CmdContainer = {
  id: 'CONTAINER',
  label: {
    fr: 'CONTENANT'
  },
  args: [ // unused
    {name: 'id', type: 'STRING'},
  ],
  parse: (args, context, obj={}) => {
    obj.id = args[1]
    return obj
  },
  print: (obj) => {
    return <div className="instruction"><span>{obj.type.label.fr}</span><span>{obj.id}</span></div>
  },
}

const CMD_TYPES = [CmdAdd, CmdMix, CmdContainer]
const labelForCmdType = (cmdType) => {
  let t = CMD_TYPES.find(e => e.id == cmdType.id)
  return t ? t.label.fr : cmdType.id
}

const ShowMix = ({page, recipes, machines, mixes, machineFoods}) => {

  const machine = page.machineId ? machines.find(m => m.id == page.machineId) : null
  const currentMachineFoods = machine ? machineFoods.filter(m => m.machine_id == machine.id) : machineFoods
  const mix = mixes.find(m => m.id == page.mixId)

  console.log('mix.recipe_id', mix.recipe_id)

  const instructions = (mix.instructions||'').split(';')
  const eInstructions = instructions.map((instruction,line) => {

    let args = instruction.split(',')
    let cmdType = CMD_TYPES.find(e => e.id == args[0])
    let obj = cmdType ? cmdType.parse(args, context) : null
    if (obj) {obj.type = cmdType}

    return (
      <li key={`${line}-${instruction}`} className={`list-group-item${!obj || obj.errors ? ' cmd-error' : ''}`}>
        {!obj || obj.errors ? <img className="float-end" style={{marginRight: '0.4em', marginTop: '0.4em'}} src="/icons/info-circle.svg" width="18" height="18"></img> : ''}
        <div className='d-flex gap-10'>
          {obj ? cmdType.print(obj) : ''}
        </div>
      </li>
    )
  })

  return (<>
    <div className="d-flex gap-20 align-items-center">
      <h1>{mix.name || 'Sans nom'}</h1>
      <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => changePage({page: PAGE_14, machineId: machine.id, mixId: mix.id})}>Modifier</button>
    </div>
    <ul className="list-group">{eInstructions}</ul>
    <div style={{height: '0.5em'}}></div>
    <div className="d-flex gap-10">
      <button type="button" className="btn btn-small btn-primary">Cuisiner</button>
      <button type="button" className="btn btn-small btn-secondary">Ajouter à mon calendrier</button>
    </div>
    <div style={{height: '1em'}}></div>
  </>)
}

const ShowRecipe = (props) => {
  return <>
    <HomeTabs {...{page: props.page, machines: props.machines}} />
    <RecipeViewer {...{recipeId: props.page.recipeId, ...props}} />
  </>
}

const EditRecipe = (props) => {

  const recipeId = props.page.recipeId
  const recipe = props.recipes.find(e => e.id == recipeId)
  useEffect(() => {
    if (!recipe || recipe.user_id != props.user.id) {
      changeUrl('/r/'+recipeId)
    }
  }, [props.recipes])

  return <>
    <HomeTabs page={props.page} machines={props.machines} />
    <RecipeEditor {...{recipe, ...props}} />
    <br/><br/><br/><br/><br/><br/><br/><br/>
  </>
}

const MixIndex = ({page, machines, mixes, machineFoods}) => {

  const machine = machines.find(m => m.id == page.machineId)
  const currentMachineFoods = machineFoods.filter(m => m.machine_id == page.machineId)

  const createMix = () => {
    ajax({url: mixes_path(), type: 'POST', data: {}, success: (mix) => {
      mixes.update([...mixes, mix])
      changePage({page: PAGE_14, machineId: machine.id, mixId: mix.id})
    }})
  }
  const destroyMix = (mix) => {
    ajax({url: mix_path(mix), type: 'DELETE', success: () => {
      mixes.update(mixes.filter(e => e.id != mix.id))
    }})
  }

  const sorted = sortBy(mixes, "name") // Sorting client side so newly created are sorted
  const eMixes = sorted.map(mix => {
    return <li key={mix.id} className="list-group-item">
      <span className="clickable" onClick={() => changePage({page: PAGE_13, machineId: machine.id, mixId: mix.id})}>{mix.name || 'Sans nom'}</span>
      <img className="clickable float-end" src="/icons/x-lg.svg" width="18" height="18" onClick={() => destroyMix(mix)}></img>
    </li>
  })

  return (<>
    <h1>Mes mélanges</h1>
    <ul className="list-group">{eMixes}</ul>
    <div style={{height: '0.5em'}}></div>
    <img className="clickable" src="/icons/plus-circle.svg" width="24" height="24" onClick={createMix}></img>
  </>)
}

const Inventory = ({page, machines, containerQuantities, machineFoods, foods, containerFormats}) => {

  const machine = machines.find(m => m.id == page.machineId)
  const currentMachineFoods = machineFoods.filter(m => m.machine_id == page.machineId)

  const items = currentMachineFoods.map(machineFood => {
    let food = foods.find(f => f.id == machineFood.food_id)
    let qties = containerQuantities.filter(c => c.machine_food_id == machineFood.id)

    //<img src={`JarIcon${containerQuantity.container_format_name}.png`} width="42" height="42"></img>
    let containers = qties.map(containerQuantity => {
      let format = containerFormats.find(f => f.id == containerQuantity.container_format_id)
      return (<span key={containerQuantity.id}>
        <span>{containerQuantity.full_qty}</span>
        <img src={`jar-${format.name}.svg`} width="42" height="42"></img>
      </span>)
    })

    return (
      <tr key={machineFood.id}>
        <td>{capitalize(food.name)}</td>
        <td>
          <div className="containers d-flex">
            <div>
              <div></div>
              <div></div>
            </div>
          </div>
        </td>
        <td>
        </td>
        <td>{containers}</td>
        <td>Modifier</td>
      </tr>
    )
  })

  return (<>
    <p>Chaque aliment est assigné une quantité souhaitée. Par exemple, je veux avoir 2 gros pots de sucre et 1 gros pot de flocons d'avoine. L'IA va alors ajouté à la liste d'épicerie le sucre lorsqu'il reste 0.999 gros pots de sucre et moins, et 0.333 gros pots de flocons d'avoine (approximatif). L'IA regarde les habitudes alimentaire et les prochains repas à être cuisiner pour déterminer cela.</p>

    <table id="inventory" className="table table-striped table-sm">
      <thead className="thead-dark">
        <tr>
          <th>Food</th>
          <th>Pot utilisé</th>
          <th>Quantité</th>
          <th>Souhaitée</th>
          <th></th>
        </tr>
      </thead>
      <tbody>{items}</tbody>
    </table>

    <h3>Add a food</h3>
  </>)
}

const HedaIndex = ({page, machines}) => {

  const machine = machines.find(m => m.id == page.machineId)
  const winWidth = useWindowWidth()

  return (<>
    <div style={{maxWidth: "100vw", width: "400px", margin: "auto"}}>
      <TagButton image="/img/calendar.jpg" title="Calendrier" handleClick={() => window.location.href = calendar_path(machine)} />
      <TagButton image="/img/blender.jpg" title="Mélanges" handleClick={() => changeUrl('/m/'+machine.id+'/l')} />
      <TagButton image="/img/bar_code.jpg" title="Inventaire" handleClick={() => changeUrl('/m/'+machine.id+'/i')} />
    
      <TagButton image="/img/jar.svg" title="Pots" handleClick={() => window.location.href = containers_path(machine)} />
      <TagButton image="/img/shopping_cart.jpg" title="Liste d'épicerie" handleClick={() => window.location.href = grocery_list_path(machine)} />
    </div>
  </>)
}

const MyRecipes = (props) => {

  return (<>
    <HomeTabs {...{page: props.page, machines: props.machines}} />
    <div className="d-flex gap-20 align-items-center">
      <h2>{t('My_recipes')}</h2>
      <Link path='/n' className="btn btn-outline-primary btn-sm">{t('New_recipe')}</Link>
    </div>
    <RecipeIndex {...props} loading={false} />
  </>)
}

const NewRecipe = ({page, recipeKinds}) => {

  const [name, setName] = useState('')
  const [usePersonalisedImage, setUsePersonalisedImage] = useState(false)

  console.log('usePerso', usePersonalisedImage)
      
  const recipeKind = findRecipeKindForRecipeName(name, recipeKinds)
  let recipeKindPreview = null
  if (recipeKind) {
    const imagePath = image_path(recipeKind.image_slug, 'small')
    recipeKindPreview = <>
      <img src={imagePath} width="255" height="171"/>
      <h3 style={{fontSize: '1.5rem'}}>{recipeKind.name}</h3>
      <input type="checkbox" name="use_recipe_kind_image"
        id="new-recipe-use-image" checked={!usePersonalisedImage}
        onChange={(e) => setUsePersonalisedImage(!e.target.checked)}
      />
      <label htmlFor="new-recipe-use-image">Utiliser cette image pour la recette?</label>
      <br/><br/>
    </>
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const record = {name}
    window.hcu.createRecord('recipes', record, (created) => {
      window.hcu.changePage({...page, page: 16, recipeId: created.id})
    })
  }

  return <>
    <h1>{t('New_recipe')}</h1>

    <form onSubmit={handleSubmit}>
      <b>{t('Name')}:</b><br/>
      <input name="name" value={name} onChange={(e) => {setName(e.target.value)}} />
      <br/><br/>
      <button type="submit" className="btn btn-primary">{t('Create')}</button>
      <Link path='/l' className="btn btn-secondary ms-3">{t('Back')}</Link>
    </form>
  </>
}

export const App = () => {
  
  const [isSearching, setIsSearching] = useState(false)

  const [page, setPage] = useState(null)
  if (!window.hcu) {initHcu()}
  window.hcu.changePage = (updated) => {
    //let locale = newPage.locale || getUrlParams(window.location.href).locale
    //window.locale = locale
    //let updated = {...newPage, locale}
    setPage(updated)
    setIsSearching(false)
    changeUrl('/', updated)
  }

  const suggestions = useHcuState(gon.suggestions.filter(r => r.tag_id), {tableName: 'suggestions'}) // FIXME: Fix the data. tag_id is mandatory...
  const favoriteRecipes = useHcuState(gon.favorite_recipes, {tableName: 'favorite_recipes'})
  const machineFoods = useHcuState(gon.machine_foods, {tableName: 'machine_foods'})
  const mixes = useHcuState(gon.mixes, {tableName: 'mixes'})
  const recipes = useHcuState(gon.recipes, {tableName: 'recipes'})
  const recipeKinds = []
  const images = useHcuState(gon.images, {tableName: 'images'})
  const tags = useHcuState(gon.tags, {tableName: 'tags'})
  //const notes = gon.notes
  const containerQuantities = useHcuState(gon.container_quantities, {tableName: 'container_quantities'})
  const containerFormats = useHcuState(gon.container_formats, {tableName: 'container_formats'})
  const foods = useHcuState(gon.foods, {tableName: 'foods'})
  const machines = useHcuState(gon.machines, {tableName: 'machines'})
  const friendsRecipes = gon.friends_recipes//.filter(r => !recipeIds.includes(r.id))
  const users = gon.users
  const user = gon.user
  window.locale = user.locale

  console.log('page', page)

  const [element, setElement] = useState(null)
  const routes = [
    {match: "/r/:id", element: <ShowRecipe {...{page, recipes, mixes, favoriteRecipes, recipeKinds, images, user, users, suggestions, tags}} />, action: (params) => {setPage({page: 15, recipeId: params.id})}},
    {match: "/c", action: (params) => {setPage({page: 4})}}, // EditTags
    {match: "/t/:id", action: (params) => {setPage({page: 3, tagId: params.id})}}, // EditTag
    {match: "/l", action: (params) => {setPage({page: 6})}}, // MyRecipes
    {match: "/e/:id", action: (params) => {setPage({page: 16, recipeId: params.id})}}, // EditRecipe
    {match: "/n", action: (params) => {setPage({page: 17})}}, // NewRecipe
    {match: "/m/:id/i", action: (params) => {setPage({page: 11, machineId: params.id})}}, // Inventory
    {match: "/m/:id/l", action: (params) => {setPage({page: 12, machineId: params.id})}}, // MixIndex
    {match: "/m/:machineId/s/:id", action: (params) => {setPage({page: 13, machineId: params.machineId})}}, // ShowMix
    {match: "/m/:machineId/e/:id", action: (params) => {setPage({page: 14, machineId: params.machineId})}}, // EditMix
    {match: "/m/:id", action: (params) => {setPage({page: 10, machineId: params.id})}}, // HedaIndex
    //[PAGE_10]: <HedaIndex {...{page, machines}} />,
    //[PAGE_11]: <Inventory {...{page, machines, machineFoods, containerQuantities, foods, containerFormats}} />,
    //[PAGE_12]: <MixIndex {...{page, machines, machineFoods, mixes}} />,
    //[PAGE_13]: <ShowMix {...{page, recipes, machines, mixes, machineFoods}} />,
    //[PAGE_14]: <EditMix {...{page, recipes, machines, mixes, machineFoods}} />,
  ]
  const defaultAction = (params) => {setPage({...{page: 1}, params})}

  useEffect(() => {

    const matchRoutes = (pathname, params) => {
      // TODO: Use params, which are query parameters as an object
      // Combine alongside the other params (named params)? User must be careful no name clashes...
      for (let i = 0; i < routes.length; i++) {
        const r = match(routes[i].match, { end: false, decode: decodeURIComponent })(pathname);
        if (r) {return routes[i].action({...params, ...r.params})}
      }
      defaultAction(params)
    }
    matchRoutes(window.location.pathname, queryToParams(window.location.search))
    const historyChanged = (event) => {
      matchRoutes(event.detail.pathname, event.detail.params)
    }
    window.addEventListener('history-changed', historyChanged)
    return () => {
      window.removeEventListener('history-changed', historyChanged)
    }
  }, [])

  useEffect(() => {
    window.locale = getUrlParams(window.location.href).locale
    window.onpopstate = (event) => {
      console.log('onpopstate')
      setPage(event.state || getUrlParams())
      setIsSearching(false)
    }
  }, [])

  const [_csrf, setCsrf] = useState('')
  useEffect(() => {
    setCsrf(document.querySelector('[name="csrf-token"]').content)
  }, [])

  // [PAGE_1]: <TagIndex {...{page, machines, tags, images}} />,
  const pages = {
    [PAGE_1]: <HomePage {...{page, recipes, tags, suggestions, favoriteRecipes, machines}} />,
    //[PAGE_2]: <TagCategorySuggestions {...{page, suggestions, recipes}} />,
    [PAGE_3]: <EditTag {...{page, tags}} />,
    [PAGE_4]: <EditTags {...{tags, page, machines}} />,
    //5: <TrainFilter page={page} recipeFilters={recipeFilters} />,
    [PAGE_6]: <MyRecipes {...{page, recipes, suggestions, favoriteRecipes, tags, mixes, recipeKinds, user, images, machines}} />,
    //[PAGE_7]: <MyBooks page={page} />,
    //[PAGE_8]: <TagEditAllCategories page={page} />,
    //[PAGE_9]: <SuggestionsIndex {...{page, tags, suggestions, recipes, recipeKinds}} />,
    [PAGE_10]: <HedaIndex {...{page, machines}} />,
    [PAGE_11]: <Inventory {...{page, machines, machineFoods, containerQuantities, foods, containerFormats}} />,
    [PAGE_12]: <MixIndex {...{page, machines, machineFoods, mixes}} />,
    [PAGE_13]: <ShowMix {...{page, recipes, machines, mixes, machineFoods}} />,
    [PAGE_14]: <EditMix {...{page, recipes, machines, mixes, machineFoods}} />,
    [PAGE_15]: <ShowRecipe {...{page, recipes, mixes, favoriteRecipes, recipeKinds, images, user, users, suggestions, tags, machines}} />,
    [PAGE_16]: <EditRecipe {...{page, recipes, mixes, user, users, recipeKinds, images, machineFoods, favoriteRecipes, machines}} />,
    [PAGE_17]: <NewRecipe {...{page, recipeKinds}} />
  }

  let otherProfiles = users.filter(u => u.id != user.id)

  if (page === null) {return ''}

  // Pour recevoir des invités => (page suivantes, quelles restrictions => véganes)
  // Theme light:
  //   Background color: #e3f2fd
  //   Title color: #4f5458
  //   Icon color: black
    //<div className={(!page.page || page.page === 1) ? "wide-trunk" : "trunk"}>
  return (<>
    <AppSearch {...{user, page, otherProfiles, _csrf, recipes, friendsRecipes, users}} />
    <div className="trunk">
      {pages[page.page || 1]}
    </div>
  </>)
}

document.addEventListener('DOMContentLoaded', () => {

  const root = document.getElementById('root')
  if (root) {ReactDOM.render(<App/>, root)}
  //const root = createRoot(document.getElementById("root"));
  //root.render(<App/>);
})



//const SuggestionsNav = ({page, tagSuggestions, categorySuggestions}) => {
//  return (<>
//    <ul className="nav nav-tabs">
//      <li className="nav-item">
//        <LinkToPage page={{...page, page: 9}} className="nav-link" active={page.page == 9}>{t('My_recipes')}{tagSuggestions ? ` (${tagSuggestions.length})` : ''}</LinkToPage>
//      </li>
//      <li className="nav-item">
//        <LinkToPage page={{...page, page: 2}} className="nav-link" active={page.page == 2}>Autres recettes{categorySuggestions ? ` (${categorySuggestions.length})` : ''}</LinkToPage>
//      </li>
//    </ul>
//    <br/>
//  </>)
//}
//
//export const SingleCarrousel = ({items, children}) => {
//  
//  const [itemNb, setItemNb] = useState(0)
//  const [position, setPosition] = useState({x: 0, y: 0})
//
//  const nextItem = () => {
//    if (itemNb < items.length-1) { setItemNb(itemNb + 1) }
//  }
//
//  const previousItem = () => {
//    setItemNb(itemNb <= 0 ? 0 : itemNb - 1)
//  }
//
//  const bind = useDrag(({swipe: [swipeX]}) => {
//    if (swipeX == 1) { previousItem() }
//    else if (swipeX == -1) nextItem()
//  })
//  
//  let onKeyDown = ({key}) => {
//    if (key == "ArrowLeft") {previousItem()}
//    if (key == "ArrowRight") {nextItem()}
//  }
//
//  useEffect(() => {
//    document.addEventListener('keydown', onKeyDown)
//    return () => {
//      document.removeEventListener('keydown', onKeyDown);
//    }
//  }, [])
//  
//  if (!items || items.length == 0) {console.log('no items to show'); return ''}
//  //if (!children || children.length != 1) {throw "Error carroussel must have one and only one children."}
//  if (!children) {throw "Error carroussel must have one and only one children."}
//  let item = items[itemNb]
//
//  return (<>
//    <div {...bind()}>
//      <div className="over-container" style={{margin: "auto"}}>
//        {children({item})}
//        <div className="left-center">
//          <img className="clickable" src={icon_path("custom-chevron-left.svg")} width="45" height="90" onClick={previousItem} aria-disabled={itemNb <= 0} />
//        </div>
//        <div className="right-center">
//          <img className="clickable" src={icon_path("custom-chevron-right.svg")} width="45" height="90" onClick={nextItem} aria-disabled={itemNb >= items.length-1} />
//        </div>
//      </div>
//    </div>
//  </>)
//}
//
//const RecipeSingleCarrousel = ({tag, suggestions, isCategory, recipes, recipeKinds}) => {
//  return <>
//    <SingleCarrousel items={suggestions}>{({item}) => {
//      let recipe = recipes.find(r => r.id == item.recipe_id)
//      return <>
//        <RecipeMediumImage {...{recipe, recipeKinds}} />
//        <LinkToPage page={{page: 15, recipeId: recipe.id}}>
//          <h2 className="bottom-center font-satisfy" style={{borderRadius: "0.5em", border: "1px solid #777", color: "#000", bottom: "1em", backgroundColor: "rgba(245, 245, 245, 0.7)", fontSize: "2em", padding: "0.2em 0.2em 0.1em 0.2em"}}>{recipe.name}</h2>
//        </LinkToPage>
//      </>
//    }}</SingleCarrousel>
//  </>
//}
//
//const SuggestionsIndex = ({tags, suggestions, page, recipes, recipeKinds}) => {
//
//  const tag = tags.find(f => f.id == page.tagId)
//  if (!tag) {console.log('No tag found'); return ''}
//  console.log('Tag found')
//
//  const tagSuggestions = suggestions.filter(suggestion => suggestion.tag_id == tag.id)
//
//  return (<>
//    <SuggestionsNav {...{page, tagSuggestions}} />
//    {tag.name ? <h2 style={{textAlign: 'center'}}>{tag.name}</h2> : ''}
//    <RecipeSingleCarrousel {...{tag, suggestions: tagSuggestions, recipes, recipeKinds}} />
//  </>)
//}
//
//const TagCategorySuggestions = ({page, recipeFilters, suggestions, recipes}) => {
//
//  throw "FIXME: What is this?"
//
//  const tag = recipeFilters.find(f => f.id == page.filterId)
//  if (!tag) {return ''}
//
//  const categorySuggestions = useCacheOrFetch(suggestions_path({recipe_filter_id: page.filterId}))
//  const tagSuggestions = suggestions.filter(suggestion => suggestion.filter_id == tag.id)
//
//  //useEffect(() => {
//  //  console.log('inside use effect')
//  //  if (suggestions) {
//  //    for (let i = 0; i < 3 && i < suggestions.length-1; i++) {
//  //      preloadSuggestion(suggestions[i])
//  //    }
//  //  }
//  //}, [suggestions])
//
//  return (<>
//    <SuggestionsNav {...{page, tagSuggestions, categorySuggestions}} />
//    {tag.name ? <h2 style={{textAlign: 'center'}}>{tag.name}</h2> : ''}
//    <RecipeSingleCarrousel tag={tag} suggestions={categorySuggestions} isCategory={true} recipes={recipes} />
//  </>)
//}
//
//const RecipeImageWithTitle = ({record, selected, selectItem}) => {
//  return <div className="over-container clickable d-inline-block" style={{border: `4px solid ${selected ? 'blue' : 'white'}`}} onClick={() => selectItem(record)}>
//    <img src={record.image_slug ? image_path(record.image_slug, "small") : "/img/default_recipe_01.png"} width="255" height="171" style={{maxWidth: "100vw"}} />
//    <h2 className="bottom-center font-satisfy" style={{borderRadius: "0.5em", border: "1px solid #777", color: "#333", bottom: "1em", backgroundColor: "#f5f5f5", fontSize: "1.2em", padding: "0.2em 0.8em 0 0.2em"}}>{record.name}</h2>
//  </div>
//}
//
//const TagEditAllCategories = ({page, recipeFilters}) => {
//  const [selected, setSelected] = useState({})
//  //const [matching, setMatching] = useState([])
//  //const [notMatching, setNotMatching] = useState([])
//  //const [unkown, setUnkown] = useState([])
//  const [items, setItems] = useState(null)
//  const fetchedItems = useCacheOrFetch(all_recipe_kinds_recipe_filters_path({recipe_filter_id: page.filterId}))
//  useEffect(() => {if (fetchedItems) {setItems(fetchedItems)}}, [fetchedItems])
//  //const all = useCacheOrFetch(all_recipe_kinds_recipe_filters_path({recipe_filter_id: page.filterId}))
//  //useEffect(() => {
//  //  if (all) {
//  //    setMatching(all.matching)
//  //    setNotMatching(all.not_matching)
//  //    setUnkown(all.unkown)
//  //  }
//  //}, [all])
//  //if (!all) {return 'Loading...'}
//  if (!items) {return 'Loading...'}
//  const unkown = items.filter(i => i.group == 0)
//  const matching = items.filter(i => i.group == 1)
//  const notMatching = items.filter(i => i.group == 2)
//
//  const filter = recipeFilters.find(f => f.id == page.filterId)
//
//  const selectItem = (item) => {
//    let s = {...selected}; s[item.id] = !selected[item.id]; setSelected(s)
//  }
//  const selectAll = (its, select=true) => {
//    let s = {...selected};
//    its.forEach(i => {s[i.id] = select})
//    setSelected(s)
//  }
//
//  const printItems = (items) => {
//    return <div style={{marginLeft: "4px"}}>
//      {((items || []).map((record) => {
//        return <RecipeImageWithTitle record={record} key={record.id} selected={selected[record.id]} selectItem={selectItem} />
//      }))}
//    </div>
//  }
//
//  const updateItems = (its, match) => {
//    let updateIds = its.filter(r => selected[r.id]).map(r => r.id)
//    ajax({url: batch_update_filtered_recipes_path(), type: 'PATCH', data: {recipe_filter_id: filter.id, ids: updateIds, match}, success: () => {
//      //let keepList = matching.filter((r,i) => !selected[i])
//      //setMatching(all.matching)
//      //setNotMatching(all.not_matching)
//      //setUnkown(all.unkown)
//      setItems(items.map(item => {
//        if (updateIds.includes(item.id)) { item.group = match ? 1 : 2 }
//        return item
//      }))
//      setSelected({})
//    }, error: (err) => {
//      console.log('Error updateItems', err)
//    }})
//  }
//  const addItems = (its, match) => {
//    let f = its.filter(r => selected[r.id])
//    let ids = f.map(r => r.id)
//    throw "FIXME NOT IMPLEMENTED: Filterable_type needs the class_name and not the table_name... ex: recipe_ingredient and not recipe_ingredients"
//    let data = f.map((d,i) => ({filterable_type: d.class_name, filterable_id: d.id, selected: match}))
//    ajax({url: batch_create_filtered_recipes_path(), type: 'POST', data: {recipe_filter_id: filter.id, data: JSON.stringify(data)}, success: () => {
//      setItems(items.map(item => {
//        if (ids.includes(item.id)) { item.group = match ? 1 : 2 }
//        return item
//      }))
//      setSelected({})
//    }, error: (err) => {
//      console.log('Error addItems', err)
//    }})
//  }
//
//  const filterName = `«${filter.name}»`
//
//  return (<>
//    <h3>Recette(s) non catégorisée(s) du filtre {filterName}?</h3>
//    {isBlank(unkown) ? <p>Auncune recette non catégorisée.</p> : printItems(unkown)}
//    <button type="button" className="btn btn-outline-primary" onClick={() => selectAll(unkown, true)}>Tout sélectionner</button>
//    <button type="button" className="btn btn-outline-primary" style={{marginLeft: "0.5em"}} onClick={() => selectAll(unkown, false)}>Tout désélectionner</button>
//    <button type="button" className="btn btn-primary" style={{marginLeft: "0.5em"}} onClick={() => addItems(unkown, true)}>Correspond</button>
//    <button type="button" className="btn btn-primary" style={{marginLeft: "0.5em"}} onClick={() => addItems(unkown, false)}>Ne correspond pas</button>
//    <h3>Recette(s) qui correspond(ent) au filtre {filterName}</h3>
//    {isBlank(matching) ? <p>Auncune recette correspond au filtre.</p> : printItems(matching)}
//    <button type="button" className="btn btn-primary" onClick={() => updateItems(matching, false)}>Retirer du filtre</button>
//    <h3>Recette(s) qui ne correspond(ent) pas au filtre {filterName}</h3>
//    {isBlank(notMatching) ? <p>Auncune recette correspond au filtre.</p> : printItems(notMatching)}
//    <button type="button" className="btn btn-primary" onClick={() => updateItems(notMatching, true)}>Ajouter au filtre</button>
//  </>)
//}
//
//const MyBooks = () => {
//
//  const books = useCacheOrFetch(user_books_books_path())
//
//  console.log('books', books)
//
//  let key = 1
//  return (<>
//    <div className="d-flex gap-20" style={{alignItems: "center"}}>
//      <h2>Mes livres</h2>
//      <a href={new_book_path()} className="btn btn-outline-primary btn-sm">Nouveau livre</a>
//    </div>
//    <hr style={{marginTop: "0"}}/>
//    <div className="position-limbo" style={{zIndex: 10}}>
//      <span id={`prev-carrousel-${key}`} style={{left: "5px", top: "80px"}} className="my-tns-control" aria-disabled='true'><img src="/icons/custom-chevron-left.svg" size="45x90"/></span>
//      <span id={`next-carrousel-${key}`} style={{left: "calc(100% - 50px)", top: "80px"}} className="my-tns-control"><img src="/icons/custom-chevron-right.svg" size="45x90"/></span>
//    </div>
//    <div style={{height: "2em"}}></div>
//    <h2>Livres favoris</h2>
//    <hr style={{marginTop: "0"}}/>
//  </>)
//}
//
//
//const TagIndex = ({page, machines, tags, images}) => {
//
//  const winWidth = useWindowWidth()
//  let pl = winWidth > 800 ? 0 : (winWidth % 200)/2
//
//  const buttons = sortBy(tags, 'position').map(tag => {
//    const image = images.find(i => i.slug == tag.image_slug)
//    const imagePath = image ? image_path(image, 'medium') : "/img/question-mark.jpg"
//    return <TagButton key={tag.id} image={imagePath} title={tag.name || "Sans nom"} handleClick={() => changePage({page: PAGE_9, tagId: tag.id})} />
//  })
//
//  const machineButtons = machines.map(machine => {
//    return <TagButton key={`machine-${machine.id}`} image='/img/robot.jpg' title={machine.name || "Heda"} handleClick={() => changePage({page: PAGE_10, machineId: machine.id})} />
//  })
//
//  // Pour recevoir des invités => (page suivantes, quelles restrictions => véganes)
//  //<TagButton image="/img/recipes.jpg" title="Mes livres" handleClick={() => {window.location.href = my_books_path()}} />
//  return (<>
//    <div style={{maxWidth: "100vw", width: "800px", margin: "auto", paddingLeft: `${pl}px`, marginLeft: '-0.3em'}}>
//      <div style={{width: "fit-content"}}>
//        <TagButton image="/img/cooking.jpg" title={t('My_recipes')} handleClick={() => changePage({page: PAGE_6})} />
//        {machineButtons}
//        {buttons}
//        <TagButton image="/icons/gear-gray.svg" title={t('Settings')} handleClick={() => changePage({page: PAGE_4})} />
//      </div>
//    </div>
//  </>)
//}
