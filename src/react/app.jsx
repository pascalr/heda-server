import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

//import Hammer from "react-hammerjs"
//var windowHistory = window.history // window.history.back() => same as back in browser
//import history from 'history/hash'

import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useCacheOrFetch, useCacheOrFetchHTML, useWindowWidth, LinkToPage } from "./lib"
import { findRecipeKindForRecipeName } from "../lib"
import { RecipeList, RecipeIndex } from './recipe_index'
import { ajax, isBlank, normalizeSearchText, preloadImage, getUrlParams, join, bindSetter, sortBy, capitalize } from "./utils"
import { icon_path, image_variant_path } from './routes'
import {TextField, AutocompleteInput, TextInput, CollectionSelect} from './form'
import {PublicImageField} from './modals/public_image'
import { DeleteConfirmButton } from './components/delete_confirm_button'
import {AddUserTagModal} from './modals/add_user_tag'
import {RecipeEditor} from "./recipe_editor"
import {RecipeViewer} from "./recipe_viewer"
import { initHcu, useHcuState } from '../hcu'
import { RecipeThumbnailImage } from "./image"

// The advantage of using this instead of the number is if I need to search and to refactor, I can easy
const PAGE_1 = 1 // TagIndex
const PAGE_2 = 2 // TagCategorySuggestions
const PAGE_3 = 3 // EditFilter
const PAGE_4 = 4 // EditUserTags
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
  
const encodeRecord = (record) => (`${record.table_name == "recipe_kinds" ? '' : '_'}${record.id}`)

const SuggestionsNav = ({page, tagSuggestions, categorySuggestions}) => {
  return (<>
    <ul className="nav nav-tabs">
      <li className="nav-item">
        <LinkToPage page={{...page, page: 9}} className="nav-link" active={page.page == 9}>Mes recettes{tagSuggestions ? ` (${tagSuggestions.length})` : ''}</LinkToPage>
      </li>
      <li className="nav-item">
        <LinkToPage page={{...page, page: 2}} className="nav-link" active={page.page == 2}>Autres recettes{categorySuggestions ? ` (${categorySuggestions.length})` : ''}</LinkToPage>
      </li>
    </ul>
    <br/>
  </>)
}

const RecipeSingleCarrousel = ({tag, suggestions, isCategory, recipes}) => {
  
  const [suggestionNb, setSuggestionNb] = useState(0)
  const [maxSuggestionNb, setMaxSuggestionNb] = useState(0)

  const nextSuggestion = () => {
    if (suggestions && suggestionNb < suggestions.length-1) {
      let nb = suggestionNb + 1
      setSuggestionNb(nb)
      if (nb > maxSuggestionNb) { setMaxSuggestionNb(nb) }
    }
    //if (suggestionNb+2 < suggestions.length-1 && suggestionNb == maxSuggestionNb) {
    //  preloadSuggestion(suggestions[suggestionNb])
    //}
  }
  const previousSuggestion = () => {
    setSuggestionNb(suggestionNb <= 0 ? 0 : suggestionNb - 1)
  }
  
  let onKeyDown = ({key}) => {
    if (key == "ArrowLeft") {previousSuggestion()}
    if (key == "ArrowRight") {nextSuggestion()}
  }

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    }
  }, [])
  
  let suggestion = suggestions ? suggestions[suggestionNb] : null
  if (!suggestion) {console.log('no suggestion to show'); return ''}

  //const preloadSuggestion = (suggestion) => {
  //  console.log('preloading suggestion')
  //  if (suggestion.image_id) {
  //    preloadImage(image_variant_path(suggestion.image_id, "medium"))
  //  }
  //}
  
  let handleSwipe = ({direction}) => {
    if (direction == 2) { // left
      nextSuggestion()
    } else if (direction == 4) { // right
      previousSuggestion()
    }
  }

  const sendStats = () => {
    if (!isCategory) {
      let skipped = []
      for (let i = 0; i < suggestionNb; i++) {
        skipped.push(encodeRecord(suggestions[i]))
      }
      for (let i = suggestionNb+1; i <= maxSuggestionNb; i++) {
        skipped.push(encodeRecord(suggestions[i]))
      }
      ajax({url: send_data_suggestions_path(), type: 'PATCH', data: {filterId: tag.id, skipped, selected: encodeRecord(suggestion)}})
    }
  }
  
  //<button type="button" className="btn btn-danger" onClick={() => nextSuggestion()}>Non, pas cette fois</button>
  
  let recipe = recipes.find(r => r.id == suggestion.recipe_id)
 
    //<Hammer onSwipe={handleSwipe}>
    //</Hammer>
  return (<>
      <div>
        <div className="over-container" style={{margin: "auto"}}>
          <img src={suggestion.image_id ? image_variant_path({id: suggestion.image_id}, "medium") : "/img/default_recipe_01.png"} style={{maxWidth: "100vw"}} width="452" height="304" />
          <LinkToPage page={{page: 15, recipeId: recipe.id}}>
            <h2 className="bottom-center font-satisfy" style={{borderRadius: "0.5em", border: "1px solid #777", color: "#333", bottom: "1em", backgroundColor: "#f5f5f5", fontSize: "2em", padding: "0.2em 0.8em 0 0.2em"}}>{recipe.name}</h2>
          </LinkToPage>
          <div className="left-center">
            <img src={icon_path("custom-chevron-left.svg")} width="45" height="90" onClick={previousSuggestion} aria-disabled={suggestionNb <= 0} />
          </div>
          <div className="right-center">
            <img src={icon_path("custom-chevron-right.svg")} width="45" height="90" onClick={nextSuggestion} aria-disabled={suggestionNb >= suggestions.length-1} />
          </div>
        </div>
      </div>
  </>)
}

const SuggestionsIndex = ({tags, suggestions, page, recipes}) => {

  const tag = tags.find(f => f.id == page.filterId)
  if (!tag) {return ''}

  const tagSuggestions = suggestions.filter(suggestion => suggestion.filter_id == tag.id)

  return (<>
    <SuggestionsNav {...{page, tagSuggestions}} />
    {tag.name ? <h2 style={{textAlign: 'center'}}>{tag.name}</h2> : ''}
    <RecipeSingleCarrousel tag={tag} suggestions={tagSuggestions} recipes={recipes} />
  </>)
}

const TagCategorySuggestions = ({page, recipeFilters, suggestions, recipes}) => {

  const tag = recipeFilters.find(f => f.id == page.filterId)
  if (!tag) {return ''}

  const categorySuggestions = useCacheOrFetch(suggestions_path({recipe_filter_id: page.filterId}))
  const tagSuggestions = suggestions.filter(suggestion => suggestion.filter_id == tag.id)

  //useEffect(() => {
  //  console.log('inside use effect')
  //  if (suggestions) {
  //    for (let i = 0; i < 3 && i < suggestions.length-1; i++) {
  //      preloadSuggestion(suggestions[i])
  //    }
  //  }
  //}, [suggestions])

  return (<>
    <SuggestionsNav {...{page, tagSuggestions, categorySuggestions}} />
    {tag.name ? <h2 style={{textAlign: 'center'}}>{tag.name}</h2> : ''}
    <RecipeSingleCarrousel tag={tag} suggestions={categorySuggestions} isCategory={true} recipes={recipes} />
  </>)
}

              //return (<td key={j}>
              //  <div className="over-container clickable" style={{margin: "auto", border: `4px solid ${selected[nb] ? 'blue' : 'white'}`}} onClick={() => imageClicked(nb)}>
//    <img src={record.image_id ? image_variant_path({id: record.image_id}, "small") : "/default_recipe_01.png"} width="255" height="171" />
              //    <h2 className="bottom-center font-satisfy" style={{borderRadius: "0.5em", border: "1px solid #777", color: "#333", bottom: "1em", backgroundColor: "#f5f5f5", fontSize: "1.2em", padding: "0.2em 0.8em 0 0.2em"}}>{record.name}</h2>
              //  </div>
              //</td>)
const RecipeImageWithTitle = ({record, selected, selectItem}) => {
  return <div className="over-container clickable d-inline-block" style={{border: `4px solid ${selected ? 'blue' : 'white'}`}} onClick={() => selectItem(record)}>
    <img src={record.image_id ? image_variant_path({id: record.image_id}, "small") : "/img/default_recipe_01.png"} width="255" height="171" style={{maxWidth: "100vw"}} />
    <h2 className="bottom-center font-satisfy" style={{borderRadius: "0.5em", border: "1px solid #777", color: "#333", bottom: "1em", backgroundColor: "#f5f5f5", fontSize: "1.2em", padding: "0.2em 0.8em 0 0.2em"}}>{record.name}</h2>
  </div>
}

const TagEditAllCategories = ({page, recipeFilters}) => {
  const [selected, setSelected] = useState({})
  //const [matching, setMatching] = useState([])
  //const [notMatching, setNotMatching] = useState([])
  //const [unkown, setUnkown] = useState([])
  const [items, setItems] = useState(null)
  const fetchedItems = useCacheOrFetch(all_recipe_kinds_recipe_filters_path({recipe_filter_id: page.filterId}))
  useEffect(() => {if (fetchedItems) {setItems(fetchedItems)}}, [fetchedItems])
  //const all = useCacheOrFetch(all_recipe_kinds_recipe_filters_path({recipe_filter_id: page.filterId}))
  //useEffect(() => {
  //  if (all) {
  //    setMatching(all.matching)
  //    setNotMatching(all.not_matching)
  //    setUnkown(all.unkown)
  //  }
  //}, [all])
  //if (!all) {return 'Loading...'}
  if (!items) {return 'Loading...'}
  const unkown = items.filter(i => i.group == 0)
  const matching = items.filter(i => i.group == 1)
  const notMatching = items.filter(i => i.group == 2)

  const filter = recipeFilters.find(f => f.id == page.filterId)

  const selectItem = (item) => {
    let s = {...selected}; s[item.id] = !selected[item.id]; setSelected(s)
  }
  const selectAll = (its, select=true) => {
    let s = {...selected};
    its.forEach(i => {s[i.id] = select})
    setSelected(s)
  }

  const printItems = (items) => {
    return <div style={{marginLeft: "4px"}}>
      {((items || []).map((record) => {
        return <RecipeImageWithTitle record={record} key={record.id} selected={selected[record.id]} selectItem={selectItem} />
      }))}
    </div>
  }

  const updateItems = (its, match) => {
    let updateIds = its.filter(r => selected[r.id]).map(r => r.id)
    ajax({url: batch_update_filtered_recipes_path(), type: 'PATCH', data: {recipe_filter_id: filter.id, ids: updateIds, match}, success: () => {
      //let keepList = matching.filter((r,i) => !selected[i])
      //setMatching(all.matching)
      //setNotMatching(all.not_matching)
      //setUnkown(all.unkown)
      setItems(items.map(item => {
        if (updateIds.includes(item.id)) { item.group = match ? 1 : 2 }
        return item
      }))
      setSelected({})
    }, error: (err) => {
      console.log('Error updateItems', err)
    }})
  }
  const addItems = (its, match) => {
    let f = its.filter(r => selected[r.id])
    let ids = f.map(r => r.id)
    throw "FIXME NOT IMPLEMENTED: Filterable_type needs the class_name and not the table_name... ex: recipe_ingredient and not recipe_ingredients"
    let data = f.map((d,i) => ({filterable_type: d.class_name, filterable_id: d.id, selected: match}))
    ajax({url: batch_create_filtered_recipes_path(), type: 'POST', data: {recipe_filter_id: filter.id, data: JSON.stringify(data)}, success: () => {
      setItems(items.map(item => {
        if (ids.includes(item.id)) { item.group = match ? 1 : 2 }
        return item
      }))
      setSelected({})
    }, error: (err) => {
      console.log('Error addItems', err)
    }})
  }

  const filterName = `«${filter.name}»`

  return (<>
    <h3>Recette(s) non catégorisée(s) du filtre {filterName}?</h3>
    {isBlank(unkown) ? <p>Auncune recette non catégorisée.</p> : printItems(unkown)}
    <button type="button" className="btn btn-outline-primary" onClick={() => selectAll(unkown, true)}>Tout sélectionner</button>
    <button type="button" className="btn btn-outline-primary" style={{marginLeft: "0.5em"}} onClick={() => selectAll(unkown, false)}>Tout désélectionner</button>
    <button type="button" className="btn btn-primary" style={{marginLeft: "0.5em"}} onClick={() => addItems(unkown, true)}>Correspond</button>
    <button type="button" className="btn btn-primary" style={{marginLeft: "0.5em"}} onClick={() => addItems(unkown, false)}>Ne correspond pas</button>
    <h3>Recette(s) qui correspond(ent) au filtre {filterName}</h3>
    {isBlank(matching) ? <p>Auncune recette correspond au filtre.</p> : printItems(matching)}
    <button type="button" className="btn btn-primary" onClick={() => updateItems(matching, false)}>Retirer du filtre</button>
    <h3>Recette(s) qui ne correspond(ent) pas au filtre {filterName}</h3>
    {isBlank(notMatching) ? <p>Auncune recette correspond au filtre.</p> : printItems(notMatching)}
    <button type="button" className="btn btn-primary" onClick={() => updateItems(notMatching, true)}>Ajouter au filtre</button>
  </>)
}

const EditFilter = ({page, recipeFilters}) => {
  const [name, setName] = useState('')
  const filter = page && page.filterId ? recipeFilters.find(f => f.id == page.filterId) : null
  if (!filter) {console.log("Can't edit filter, did not exist."); return '';}

  return (<>
    <h2>Modifier le filtre</h2>
    <h3>Titre</h3>
    <TextField model={filter} field="name" url={recipe_filter_path(filter)} getter={recipeFilters} setter={recipeFilters.update} />
    <h3>Image</h3>
    <PublicImageField model={filter} field="image_src" defaultSrc={"question-mark.jpg"} url={recipe_filter_path(filter)} getter={recipeFilters} setter={recipeFilters.update} />
    <br/>
    <div>
      <button type="button" className="btn btn-primary" onClick={() => {}}>Modifier les recettes correspondantes (not implemented yet)</button>
    </div>
    <br/>
    <div>
      <button type="button" className="btn btn-primary" onClick={() => changePage({page: 8, filterId: filter.id})}>Modifier les catégories correspondantes</button>
    </div>
  </>)
}

const EditUserTags = ({userTags, recipeFilters, page}) => {

  //userTags = sortBy(userTags, "position") Not necessary, done on server side

  const removeUserTag = (userTag) => {
    ajax({url: user_tag_path(userTag), type: 'DELETE', success: () => {
      userTags.update(userTags.filter(f => f.id != userTag.id))
    }})
  }
  
  const [showAddModal, setShowAddModal] = useState(false)

  const userTagsC = userTags.map((userTag, index) => {
    let tag = recipeFilters.find(t => t.id == userTag.tag_id)
    return <Draggable key={`drag-user-tag-${userTag.id}`} draggableId={`drag-user-tag-${userTag.id.toString()}`} index={index}>
      {(provided) => (<>
        <div className="item-container" ref={provided.innerRef} {...provided.dragHandleProps} {...provided.draggableProps}>
          <li>
            <span className="cursor-pointer" onClick={() => changePage({page: 3, filterId: tag.id})}>{tag.name || "Sans nom"}</span>
            <DeleteConfirmButton id={`del-user-tag-${userTag.id}`} onDeleteConfirm={() => removeUserTag(userTag)} message="Je veux retirer cette étiquette?" />
          </li>
        </div>
      </>)}
    </Draggable>
  })

  const handleDrop = ({source, destination, type, draggableId}) => {
    if (!destination) return; // Ignore drop outside droppable container
    
    let userTagId = draggableId.substr(14) // removes "drag-user-tag-"

    var updatedList = [...userTags];
    const [reorderedItem] = updatedList.splice(source.index, 1);
    updatedList.splice(destination.index, 0, reorderedItem);

    let data = {position: destination.index+1}
    ajax({url: user_tag_path({id: userTagId}), type: 'PATCH', data, success: () => {
      updatedList.forEach((el,i) => {el.position = i+1}) 
      userTags.update(updatedList)
    }})
  }

  return (<>
    <AddUserTagModal showModal={showAddModal} setShowModal={setShowAddModal} tags={recipeFilters} userTags={userTags} />
    <div className="d-flex gap-15 align-items-center">
      <h2>Tags</h2>
      <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setShowAddModal(true)}>Ajouter un tag</button>
    </div>
    <DragDropContext onDragEnd={handleDrop}>
      <Droppable droppableId="user-tags-container">
        {(provided) => (<>
          <div className="user-tags-container" {...provided.droppableProps} ref={provided.innerRef}>
            <ul>
              {userTagsC}
            </ul>
            {provided.placeholder}
          </div>
        </>)}
      </Droppable>
    </DragDropContext>
  </>)
}

const TagButton = ({winWidth, image, title, handleClick}) => {
  return (
    <div style={{width: '200px', padding: '25px', display: "inline-block"}}>
      <button className="plain-btn d-flex flex-column align-items-center" onClick={handleClick}>
        <img src={image} width="150" height="150" />
        <b>{title}</b>
      </button>
    </div>
  )
}
const TagIndex = ({page, machines, recipeFilters, addRecipeFilter, userTags}) => {

  const winWidth = useWindowWidth()
  let pl = winWidth > 800 ? 0 : (winWidth % 200)/2

  const buttons = userTags.map(userTag => {
    let tag = recipeFilters.find(t => t.id == userTag.tag_id)
    return <TagButton key={userTag.id} winWidth={winWidth} image={`/img/${tag.image_src || "question-mark.jpg"}`} title={tag.name || "Sans nom"} handleClick={() => changePage({page: PAGE_9, filterId: tag.id})} />
  })

  const machineButtons = machines.map(machine => {
    return <TagButton key={`machine-${machine.id}`} winWidth={winWidth} image='/img/robot.jpg' title={machine.name || "Heda"} handleClick={() => changePage({page: PAGE_10, machineId: machine.id})} />
  })

  // Pour recevoir des invités => (page suivantes, quelles restrictions => véganes)
  //<TagButton winWidth={winWidth} image="/img/recipes.jpg" title="Mes livres" handleClick={() => {window.location.href = my_books_path()}} />
  return (<>
    <div style={{maxWidth: "100vw", width: "800px", margin: "auto", paddingLeft: `${pl}px`, marginLeft: '-0.3em'}}>
      <div style={{width: "fit-content"}}>
        <TagButton winWidth={winWidth} image="/img/cooking.jpg" title="Mes recettes" handleClick={() => changePage({page: PAGE_6})} />
        {machineButtons}
        {buttons}
        <TagButton winWidth={winWidth} image="/icons/gear-gray.svg" title="Paramètres" handleClick={() => changePage({page: PAGE_4})} />
      </div>
    </div>
  </>)
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

const ShowMix = ({page, recipes, favoriteRecipes, machines, mixes, machineFoods}) => {

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

export const EditMix = ({page, recipes, favoriteRecipes, machines, mixes, machineFoods}) => {

  const context = {recipes, favoriteRecipes, machines, mixes, machineFoods}

  const machine = page.machineId ? machines.find(m => m.id == page.machineId) : null
  const currentMachineFoods = machine ? machineFoods.filter(m => m.machine_id == machine.id) : machineFoods
  const mix = page.recipeId ? mixes.find(m => m.recipe_id == page.recipeId) : mixes.find(m => m.id == page.mixId)
  console.log('edit mix', mix)

  if (!mix) { return '' }

  //const recipeHTML = useCacheOrFetchHTML(inline_recipe_path({id: mix.recipe_id}), {waitFor: mix.recipe_id})

  const update = () => {
    console.log('UPDATING')
    ajax({url: mix_path(mix), type: 'PATCH', data: {mix: {recipe_id: mix.recipe_id, name: mix.name, instructions: mix.instructions}}, success: (mix) => {
      mixes.update(mixes.map(e => e.id == mix.id ? mix : e))
    }})
  }
  
  const instructions = (mix.instructions||'').split(';')

  const addInstruction = () => {
    mix.instructions = (mix.instructions||'')+';'; update()
  }
  const updateName = (newName) => {
    mix.name = newName; update()
  }
  const removeInstruction = (line) => {
    let e = [...instructions]
    e.splice(line, 1)
    mix.instructions = e.join(';'); update()
  }
  const changeInstruction = (cmd,line) => {
    instructions[line] = cmd
    mix.instructions = instructions.join(';')
    update()
  }
  const updateArg = (argNb, value, line) => {
    let args = instructions[line].split(',')
    args[argNb] = value
    instructions[line] = args.join(',')
    mix.instructions = instructions.join(';')
    console.log('calling update 01'); update()
  }
  const handleDrop = ({source, destination, type, draggableId}) => {
    if (!destination) return; // Ignore drop outside droppable container
    
    var updatedList = [...instructions];
    const [reorderedItem] = updatedList.splice(source.index, 1);
    updatedList.splice(destination.index, 0, reorderedItem);

    mix.instructions = updatedList.join(';')
    update()
  }
  const moveMixAddToIng = (obj, line) => {
    let data = {recipe_ingredient: {
      raw: obj.qty,
      raw_food: obj.machineFoodName
    }}
    ajax({url: recipe_recipe_ingredients_path(gon.recipe), type: 'POST', data: data, success: (ingredient) => {
      window.recipe_editor.current.addIng(ingredient)
      removeInstruction(line)
    }})
  }

  const eInstructions = instructions.map((instruction,line) => {

    let args = instruction.split(',')
    let cmd = args[0]

    let cmdType = CMD_TYPES.find(e => e.id == cmd)
    let obj = cmdType ? cmdType.parse(args, context) : null
    if (obj) {obj.type = cmdType}

    let eArgs = ''
    if (obj && obj.type.id == "ADD") {
      eArgs = (<>
        <TextInput defaultValue={obj.qty} onBlur={(qty) => updateArg(1, qty, line)} />
        <AutocompleteInput name="food" choices={currentMachineFoods} defaultValue={obj.machineFoodName}
          onSelect={(e, term, item) => {
            f = currentMachineFoods.find(e => e.id == item.dataset.id);
            updateArg(2, `${item.dataset.id}-${f ? f.name : ''}`, line)
          }} onBlur={(name) => {
            f = currentMachineFoods.find(e => e.name  == name);
            updateArg(2, `${f ? f.id : ''}-${name}`, line)
          }} minChars={0}
        />
      </>)
    } else if (obj && obj.type.id == "CONTAINER") {
      eArgs = (<>
        <TextInput defaultValue={obj.id} onBlur={(id) => updateArg(1, id, line)} />
      </>)
    }

    return (
      <Draggable key={`drag-instruction-${line}-${args}`} draggableId={`drag-instruction-${line}-${args}`} index={line}>
        {(provided) => (<>
          <div className="item-container" ref={provided.innerRef} {...provided.dragHandleProps} {...provided.draggableProps}>
            <li key={`${line}-${instruction}`} className={`list-group-item${!obj || obj.errors ? ' cmd-error' : ''}`}>
              <img className="clickable float-end" style={{marginTop: '0.4em'}} src="/icons/x-lg.svg" width="18" height="18" onClick={() => removeInstruction(line)}></img>
              {(obj && obj.type.id == "ADD") ? <img className="clickable float-end" style={{marginRight: '0.4em', marginTop: '0.4em'}} src="/icons/arrow-down-up.svg" width="18" height="18" onClick={() => moveMixAddToIng(obj, line)}></img> : ''}
    
              {!obj || obj.errors ? <img className="float-end" style={{marginRight: '0.6em', marginTop: '0.4em'}} src="/icons/info-circle.svg" width="18" height="18"></img> : ''}
              <div className='d-flex gap-10'>
                <div className="dropdown">
                  <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    {obj ? obj.type.label.fr : cmd}
                  </button>
                  <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                    {CMD_TYPES.filter(e => e != cmd).map((cmdType,i) => (
                      <span key={i} className="dropdown-item" onClick={() => changeInstruction(cmdType.id, line)}>
                        {labelForCmdType(cmdType)}
                      </span>
                    ))}
                  </div>
                </div>
                {eArgs}
              </div>
            </li>
          </div>
        </>)}
      </Draggable>
    )
  })

  const recipeIds = favoriteRecipes.map(r => r.recipe_id).concat(recipes.map(r => r.id))
  const recipeNames = {}
  favoriteRecipes.forEach(r => {recipeNames[r.recipe_id] = r.name})
  recipes.forEach(r => {recipeNames[r.id] = r.name})
    
  //  <br/><br/>
  //  <h2>Recette</h2>
  //  <h3>Lier avec une recette existante:</h3>
  //  <CollectionSelect model={mix} field="recipe_id" options={recipeIds} showOption={(id) => recipeNames[id]} includeBlank="true" onChange={id => {mix.recipe_id = id; update()}} />
  //  <h3>Lier en clonant une recette existante:</h3>
  //  <h3>Créer une nouvelle recette:</h3>
  //  <h3>Aperçu</h3>
  //  {recipeHTML ? <div dangerouslySetInnerHTML={{__html: recipeHTML}} /> : ''}

  // <h1 contentEditable suppressContentEditableWarning={true} onBlur={(e) => {updateName(e.target.innerText)}}>
  //   {mix.name || 'Sans nom'}
  // </h1>
  // <h2>Commandes</h2>
  return (<>
    <DragDropContext onDragEnd={handleDrop}>
      <Droppable droppableId="instructions-container">
        {(provided) => (<>
          <div className="instructions-container" {...provided.droppableProps} ref={provided.innerRef}>
            <ul className="list-group">{eInstructions}</ul>
            {provided.placeholder}
          </div>
        </>)}
      </Droppable>
    </DragDropContext>
    <div style={{height: '0.5em'}}></div>
    <img className="clickable" src="/icons/plus-circle.svg" width="24" height="24" onClick={addInstruction}></img>
  </>)
}

const ShowRecipe = (props) => {
  return <RecipeViewer {...{recipeId: props.page.recipeId, ...props}} />
}

const EditRecipe = (props) => {
  return <RecipeEditor {...{recipeId: props.page.recipeId, ...props}} />
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
      <TagButton winWidth={winWidth} image="/img/calendar.jpg" title="Calendrier" handleClick={() => window.location.href = calendar_path(machine)} />
      <TagButton winWidth={winWidth} image="/img/blender.jpg" title="Mélanges" handleClick={() => changePage({page: PAGE_12, machineId: machine.id})} />
      <TagButton winWidth={winWidth} image="/img/bar_code.jpg" title="Inventaire" handleClick={() => changePage({page: PAGE_11, machineId: machine.id})} />
    
      <TagButton winWidth={winWidth} image="/img/jar.svg" title="Pots" handleClick={() => window.location.href = containers_path(machine)} />
      <TagButton winWidth={winWidth} image="/img/shopping_cart.jpg" title="Liste d'épicerie" handleClick={() => window.location.href = grocery_list_path(machine)} />
    </div>
  </>)
}
const MyBooks = () => {

  const books = useCacheOrFetch(user_books_books_path())

  console.log('books', books)

  let key = 1
  return (<>
    <div className="d-flex gap-20" style={{alignItems: "center"}}>
      <h2>Mes livres</h2>
      <a href={new_book_path()} className="btn btn-outline-primary btn-sm">Nouveau livre</a>
    </div>
    <hr style={{marginTop: "0"}}/>
    <div className="position-limbo" style={{zIndex: 10}}>
      <span id={`prev-carrousel-${key}`} style={{left: "5px", top: "80px"}} className="my-tns-control" aria-disabled='true'><img src="/icons/custom-chevron-left.svg" size="45x90"/></span>
      <span id={`next-carrousel-${key}`} style={{left: "calc(100% - 50px)", top: "80px"}} className="my-tns-control"><img src="/icons/custom-chevron-right.svg" size="45x90"/></span>
    </div>
    <div style={{height: "2em"}}></div>
    <h2>Livres favoris</h2>
    <hr style={{marginTop: "0"}}/>
  </>)
}

const useTransition = (initial, current, final) => {
  const [state, setState] = useState(initial)

  useEffect(() => {
    setState(final)
  }, [current])

  return state
}

const RecipeListItem = ({recipe, current, tags, recipeKinds, page, selected, users, user, images, selectedRef}) => {
  let userName = null
  let isSelected = current == selected
  if (user.id != recipe.user_id) {
    const recipeUser = users.find(u => u.id == recipe.user_id)
    userName = recipeUser ? recipeUser.name : `user${recipe.user_id}`
  }
  return (
    <li key={recipe.id} ref={isSelected ? selectedRef : null}>
      <LinkToPage page={{...page, page: 15, recipeId: recipe.id}} style={{color: 'black', fontSize: '1.1em', textDecoration: 'none'}} className={isSelected ? "selected" : undefined}>
        <div className="d-flex align-items-center">
          <RecipeThumbnailImage {...{recipe, recipeKinds, images}} />
          <div style={{marginRight: '0.5em'}}></div>
          {userName ? <div><div>{recipe.name}</div><div className="h002">de {userName}</div></div> : recipe.name}
        </div>
      </LinkToPage>
    </li>
  )
}

const SearchBox = ({recipes, recipeKinds, tags, page, friendsRecipes, users, user, images, setIsSearching}) => {

  // Search is the text shown in the input field
  // Term is the term currently used to filter the search
  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  const [selected, setSelected] = useState(-1)
  const inputField = useRef(null)
  const selectedRef = useRef(null)
  const minChars = 3

  useEffect(() => {
    inputField.current.focus()
  }, [])
  
  useEffect(() => {
    //displayRef.current.scrollTop = 56.2*(selected||0)
    if (selectedRef.current) { selectedRef.current.scrollIntoView(false) }
  }, [selected])

  const filterItems = (items, term) => {
    if (isBlank(term) || term.length < minChars) {return []}
    const normalized = normalizeSearchText(term)
    return items.filter(r => (
      r.name && ~normalizeSearchText(r.name).indexOf(normalized)
    ))
  }
  let userRecipes = recipes.filter(r => r.user_id == user.id)
  let matchingUserRecipes = filterItems(userRecipes, term)
  let matchingFriendsRecipes = filterItems(friendsRecipes, term)
  let allMatching = [...matchingUserRecipes, ...matchingFriendsRecipes]

  let select = (pos) => {
    setSelected(pos)
    setSearch(pos == -1 ? '' : allMatching[pos].name)
  }

  let onKeyDown = ({key}) => {
    if (key == "ArrowDown") {select(selected >= allMatching.length-1 ? -1 : selected+1)}
    else if (key == "ArrowUp") {select(selected < 0 ? allMatching.length-1 : selected-1)}
    else if (key == "Enter") {changePage({...page, page: PAGE_15, recipeId: allMatching[selected].id})}
    else if (key == "Escape") {
      if (!term || term == '') { setIsSearching(false) }
      else { setSearch(''); setTerm('') }
    }
  }

  return (<>
    <div style={{transition: 'height 1s'}}>
      <input ref={inputField} type="search" placeholder="Rechercher..." onChange={(e) => {setTerm(e.target.value); setSearch(e.target.value)}} autoComplete="off" style={{width: "100%"}} onKeyDown={onKeyDown} value={search}/>
      <div style={{height: 'calc(100vh - 125px)', overflowY: 'scroll'}}>
        {matchingUserRecipes.length >= 1 ? <h2 className="h001">Mes recettes</h2> : ''}
        <ul className="recipe-list">
          {matchingUserRecipes.map((recipe, current) => (
            <RecipeListItem key={recipe.id} {...{recipe, current, tags, recipeKinds, page, selected, users, user, images, selectedRef}}/>
          ))}
        </ul>
        {matchingFriendsRecipes.length >= 1 ? <h2 className="h001">Suggestions</h2> : ''}
        <ul className="recipe-list">
          {matchingFriendsRecipes.map((recipe, current) => (
            <RecipeListItem key={recipe.id} {...{recipe, current: current+matchingUserRecipes.length, tags, recipeKinds, page, selected, users, user, images, selectedRef}}/>
          ))}
        </ul>
      </div>
    </div>
  </>)
}

const MyRecipes = (props) => {

  return (<>
    <div className="d-flex gap-20 align-items-center">
      <h2>Mes recettes</h2>
      <LinkToPage page={{...props.page, page: 17}} className="btn btn-outline-primary btn-sm">Nouvelle recette</LinkToPage>
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
    const imagePath = image_variant_path({id: recipeKind.image_id}, 'small')
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
    const record = {table_name: 'recipes', name, use_personalised_image: usePersonalisedImage}
    window.hcu.createRecord(record, (created) => {
      window.hcu.changePage({...page, page: 16, recipeId: created.id})
    })
  }

  return <>
    <h1>Nouvelle recette</h1>

    <form onSubmit={handleSubmit}>
      <b>Nom:</b><br/>
      <input name="name" value={name} onChange={(e) => {setName(e.target.value)}} />
      <br/><br/>
      <b>Catégorie:</b><br/>
      {recipeKind ? recipeKindPreview : <p>Aucune catégorie correspondante</p>}
      <button type="submit" className="btn btn-primary">Créer</button>
    </form>
  </>
}

const App = () => {
  
  const [isSearching, setIsSearching] = useState(false)

  const [page, setPage] = useState(getUrlParams())
  if (!window.hcu) {initHcu()}
  window.hcu.changePage = (updated) => {
    setPage(updated)
    setIsSearching(false)
    window.history.replaceState(updated, '', '?'+new URLSearchParams(updated).toString())
  }

  const [_csrf, setCsrf] = useState('')
  useEffect(() => {
    setCsrf(document.querySelector('[name="csrf-token"]').content)
  }, [])

  const recipeFilters = gon.recipe_filters
  const suggestions = gon.suggestions
  const userTags = gon.user_tags
  const favoriteRecipes = useHcuState(gon.favorite_recipes, {tableName: 'favorite_recipes'})
  const machines = gon.machines
  const machineFoods = useHcuState(gon.machine_foods, {tableName: 'machine_foods'})
  const containerQuantities = gon.container_quantities
  const containerFormats = gon.container_formats
  const mixes = gon.mixes
  const foods = gon.foods
  const recipes = useHcuState(gon.recipes, {tableName: 'recipes'})
  const recipeKinds = gon.recipe_kinds
  const images = gon.images
  const user = gon.user
  const users = gon.users
  const notes = gon.notes
  const friendsRecipes = gon.friends_recipes//.filter(r => !recipeIds.includes(r.id))

  const parentPages = {
    [PAGE_2]: PAGE_1,
    [PAGE_3]: PAGE_4,
    [PAGE_4]: PAGE_1,
    //[PAGE_5]: PAGE_3,
    [PAGE_6]: PAGE_1,
    [PAGE_7]: PAGE_1,
    [PAGE_8]: PAGE_3, // TagEditAllCategories => EditFilter
    [PAGE_9]: PAGE_1,
    [PAGE_10]: PAGE_1,
    [PAGE_11]: PAGE_10,
    [PAGE_12]: PAGE_10,
    [PAGE_13]: PAGE_12,
    [PAGE_14]: PAGE_13,
    [PAGE_15]: PAGE_6,
    [PAGE_16]: PAGE_15,
    [PAGE_17]: PAGE_6,
  }

  const pages = {
    [PAGE_1]: <TagIndex {...{page, recipeFilters, userTags, machines}} addRecipeFilter={(filter) => recipeFilters.update(recipeFilters.concat([filter]))} />,
    [PAGE_2]: <TagCategorySuggestions {...{page, recipeFilters, suggestions, recipes}} />,
    [PAGE_3]: <EditFilter page={page} recipeFilters={recipeFilters} />,
    [PAGE_4]: <EditUserTags recipeFilters={recipeFilters}userTags={userTags} page={page} />,
    //5: <TrainFilter page={page} recipeFilters={recipeFilters} />,
    [PAGE_6]: <MyRecipes {...{page, recipes, suggestions, recipeFilters, favoriteRecipes, tags: recipeFilters, mixes, recipeKinds, user, images}} />,
    [PAGE_7]: <MyBooks page={page} />,
    [PAGE_8]: <TagEditAllCategories page={page} recipeFilters={recipeFilters} />,
    [PAGE_9]: <SuggestionsIndex page={page} suggestions={suggestions} tags={recipeFilters} recipes={recipes} />,
    [PAGE_10]: <HedaIndex {...{page, machines}} />,
    [PAGE_11]: <Inventory {...{page, machines, machineFoods, containerQuantities, foods, containerFormats}} />,
    [PAGE_12]: <MixIndex {...{page, machines, machineFoods, mixes}} />,
    [PAGE_13]: <ShowMix {...{page, recipes, favoriteRecipes, machines, mixes, machineFoods}} />,
    [PAGE_14]: <EditMix {...{page, recipes, favoriteRecipes, machines, mixes, machineFoods}} />,
    [PAGE_15]: <ShowRecipe {...{page, recipes, mixes, favoriteRecipes, recipeKinds, images, user, users, suggestions, tags: recipeFilters}} />,
    [PAGE_16]: <EditRecipe {...{page, recipes, mixes, user, users, recipeKinds, images}} />,
    [PAGE_17]: <NewRecipe {...{page, recipeKinds}} />
  }

  // I don't want a back system, I want a up system. So if you are given a nested link, you can go up.
  const goUp = () => {
    if (page.page && parentPages[page.page]) {
      changePage({...page, page: parentPages[page.page]})
    }
  }

  let moveBtn = ''
  if (!isSearching && page.page && parentPages[page.page]) {
    moveBtn = <img className="clickable" src={icon_path("arrow-up-square.svg")} width="32" style={{paddingLeft: "0.5em"}} onClick={goUp} />
  }

  // Pour recevoir des invités => (page suivantes, quelles restrictions => véganes)
  return (<>
    <nav style={{backgroundColor: '#e3f2fd', marginBottom: '0.5em', borderBottom: '1px solid #cee2f0'}}>
      <div style={{maxWidth: '800px', margin: 'auto', padding: '0.5em 0 0.5em 0'}}>
        <div className="float-start" style={{margin: '0.3em 0 0 0.5em'}}>
          {moveBtn}
        </div>
        <div className="float-end" style={{marginTop: '0.25em'}}>
          <img className="clickable" src={isSearching ? icon_path("x-lg.svg") : icon_path("search_black.svg")} width="24" onClick={() => {setIsSearching(!isSearching)}} style={{marginRight: '1em'}} />
          <div className="dropdown d-inline-block">
            <button className="plain-btn dropdown-toggle" type="button" id="dropdownUserButton" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style={{marginRight: '1em'}}>
              <img className="clickable" src={icon_path("person.svg")} width="28"/>
            </button>
            <div className="dropdown-menu" aria-labelledby="dropdownUserButton">
              <a href="/edit_profile" className="dropdown-item">Mon profil</a>
              <form action="/logout" method="post">
                <button className="dropdown-item" type="submit">Logout</button>
                <input type="hidden" name="_csrf" value={_csrf}/>
              </form>
              <hr className="dropdown-divider"/>
              <h6 className="dropdown-header">Changer d'utilisateur</h6>
              { users.map((usr) => { 
                if (usr.id == user.id) {return;}
                return <form key={usr.id} action="/change_user" method="post">
                  <button className="dropdown-item" type="submit">{ usr.name }</button>
                  <input type="hidden" name="user_id" value={usr.id}/>
                  <input type="hidden" name="_csrf" value={_csrf}/>
                </form>
              })}
            </div>
          </div>
        </div>
        <div style={{margin: 'auto', width: 'fit-content', fontWeight: '500', fontSize: '1.5rem', color: '#4f5458'}} className="clickable" onClick={() => changePage(1)}>HedaCuisine</div>
      </div>
    </nav>
    <div id="trunk">
      {isSearching ? <SearchBox {...{page, recipes, recipeKinds, tags: recipeFilters, friendsRecipes, users, user, images, setIsSearching}} /> : pages[page.page || 1]}
    </div>
  </>)
}

document.addEventListener('DOMContentLoaded', () => {

  const root = document.getElementById('root')
  ReactDOM.render(<App/>, root)
  //const root = createRoot(document.getElementById("root"));
  //root.render(<App/>);
})
