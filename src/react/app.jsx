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

  let animals = ['1f400', '1f401', '1f402', '1f403', '1f404', '1f405', '1f406', '1f407', '1f408', '1f409', '1f40a', '1f40b', '1f40c', '1f40d', '1f40e', '1f40f', '1f410', '1f411', '1f412', '1f413', '1f414', '1f415', '1f416', '1f417', '1f418', '1f419', '1f41a', '1f41b', '1f41c', '1f41d', '1f41e', '1f41f', '1f420', '1f421', '1f422', '1f423', '1f424', '1f425', '1f426', '1f427', '1f428', '1f429', '1f42a', '1f42b', '1f42c', '1f42d', '1f42e', '1f42f', '1f430', '1f431', '1f432', '1f433', '1f434', '1f435', '1f436', '1f437', '1f438', '1f439', '1f43a', '1f43b', '1f43c', '1f43d', '1f43e', '1f43f', '1f980', '1f981', '1f982', '1f983', '1f984', '1f985', '1f986', '1f987', '1f988', '1f989', '1f98a', '1f98b', '1f98c', '1f98d', '1f98e', '1f98f', '1f990', '1f991', '1f992', '1f993', '1f994', '1f995', '1f996', '1f997', '1f998', '1f999', '1f99a', '1f99b', '1f99c', '1f99d', '1f99e', '1f99f', '1f9a0', '1f9a1', '1f9a2', '1f9a3', '1f9a4', '1f9a5', '1f9a6', '1f9a7', '1f9a8', '1f9a9', '1f9aa', '1f9ab', '1f9ac', '1f9ad', '1f9ae']

  let foods = ['1f32d', '1f32e', '1f32f', '1f330', '1f331', '1f332', '1f333', '1f334', '1f335', '1f336', '1f337', '1f338', '1f339', '1f33a', '1f33b', '1f33c', '1f33d', '1f33e', '1f33f', '1f340', '1f341', '1f342', '1f343', '1f344', '1f345', '1f346', '1f347', '1f348', '1f349', '1f34a', '1f34b', '1f34c', '1f34d', '1f34e', '1f34f', '1f350', '1f351', '1f352', '1f353', '1f354', '1f355', '1f356', '1f357', '1f358', '1f359', '1f35a', '1f35b', '1f35c', '1f35d', '1f35e', '1f35f', '1f360', '1f361', '1f362', '1f363', '1f364', '1f365', '1f366', '1f367', '1f368', '1f369', '1f36a', '1f36b', '1f36c', '1f36d', '1f36e', '1f36f', '1f370', '1f371', '1f372', '1f373', '1f374', '1f375', '1f376', '1f377', '1f378', '1f379', '1f37a', '1f37b', '1f37c', '1f37d', '1f37e', '1f37f', '1f950', '1f951', '1f952', '1f953', '1f954', '1f955', '1f956', '1f957', '1f958', '1f959', '1f95a', '1f95b', '1f95c', '1f95d', '1f95e', '1f95f', '1f960', '1f961', '1f962', '1f963', '1f964', '1f965', '1f966', '1f967', '1f968', '1f969', '1f96a', '1f96b', '1f96c', '1f96d', '1f96e', '1f96f', '1fad0', '1fad1', '1fad2', '1fad3', '1fad4', '1fad5', '1fad6']

  let smileys = ['1f600', '1f601', '1f602', '1f603', '1f604', '1f605', '1f606', '1f607', '1f608', '1f609', '1f60a', '1f60b', '1f60c', '1f60d', '1f60e', '1f60f', '1f610', '1f611', '1f612', '1f613', '1f614', '1f615', '1f616', '1f617', '1f618', '1f619', '1f61a', '1f61b', '1f61c', '1f61d', '1f61e', '1f61f', '1f620', '1f621', '1f622', '1f623', '1f624', '1f625', '1f626', '1f627', '1f628', '1f629', '1f62a', '1f62b', '1f62c', '1f62d', '1f62e', '1f62f', '1f630', '1f631', '1f632', '1f633', '1f634', '1f635', '1f636', '1f637', '1f638', '1f639', '1f63a', '1f63b', '1f63c', '1f63d', '1f63e', '1f63f', '1f640', '1f641', '1f642', '1f643', '1f644']

  let toRemove = ['1f170', '1f171', '1f17e', '1f17f', '1f18e', '1f191', '1f192', '1f193', '1f194', '1f195', '1f196', '1f197', '1f198', '1f199', '1f19a']

  let codes = ['0023', '002a', '0030', '0031', '0032', '0033', '0034', '0035', '0036', '0037', '0038', '0039', '00a9', '00ae', '1f004', '1f0cf', '1f1e6', '1f1e7', '1f1e8', '1f1e9', '1f1ea', '1f1eb', '1f1ec', '1f1ed', '1f1ee', '1f1ef', '1f1f0', '1f1f1', '1f1f2', '1f1f3', '1f1f4', '1f1f5', '1f1f6', '1f1f7', '1f1f8', '1f1f9', '1f1fa', '1f1fb', '1f1fc', '1f1fd', '1f1fe', '1f1ff', '1f201', '1f202', '1f21a', '1f22f', '1f232', '1f233', '1f234', '1f235', '1f236', '1f237', '1f238', '1f239', '1f23a', '1f250', '1f251', '1f300', '1f301', '1f302', '1f303', '1f304', '1f305', '1f306', '1f307', '1f308', '1f309', '1f30a', '1f30b', '1f30c', '1f30d', '1f30e', '1f30f', '1f310', '1f311', '1f312', '1f313', '1f314', '1f315', '1f316', '1f317', '1f318', '1f319', '1f31a', '1f31b', '1f31c', '1f31d', '1f31e', '1f31f', '1f320', '1f321', '1f324', '1f325', '1f326', '1f327', '1f328', '1f329', '1f32a', '1f32b', '1f32c', '1f380', '1f381', '1f382', '1f383', '1f384', '1f385', '1f386', '1f387', '1f388', '1f389', '1f38a', '1f38b', '1f38c', '1f38d', '1f38e', '1f38f', '1f390', '1f391', '1f392', '1f393', '1f396', '1f397', '1f399', '1f39a', '1f39b', '1f39e', '1f39f', '1f3a0', '1f3a1', '1f3a2', '1f3a3', '1f3a4', '1f3a5', '1f3a6', '1f3a7', '1f3a8', '1f3a9', '1f3aa', '1f3ab', '1f3ac', '1f3ad', '1f3ae', '1f3af', '1f3b0', '1f3b1', '1f3b2', '1f3b3', '1f3b4', '1f3b5', '1f3b6', '1f3b7', '1f3b8', '1f3b9', '1f3ba', '1f3bb', '1f3bc', '1f3bd', '1f3be', '1f3bf', '1f3c0', '1f3c1', '1f3c2', '1f3c3', '1f3c4', '1f3c5', '1f3c6', '1f3c7', '1f3c8', '1f3c9', '1f3ca', '1f3cb', '1f3cc', '1f3cd', '1f3ce', '1f3cf', '1f3d0', '1f3d1', '1f3d2', '1f3d3', '1f3d4', '1f3d5', '1f3d6', '1f3d7', '1f3d8', '1f3d9', '1f3da', '1f3db', '1f3dc', '1f3dd', '1f3de', '1f3df', '1f3e0', '1f3e1', '1f3e2', '1f3e3', '1f3e4', '1f3e5', '1f3e6', '1f3e7', '1f3e8', '1f3e9', '1f3ea', '1f3eb', '1f3ec', '1f3ed', '1f3ee', '1f3ef', '1f3f0', '1f3f3', '1f3f4', '1f3f5', '1f3f7', '1f3f8', '1f3f9', '1f3fa', '1f3fb', '1f3fc', '1f3fd', '1f3fe', '1f3ff', '1f440', '1f441', '1f442', '1f443', '1f444', '1f445', '1f446', '1f447', '1f448', '1f449', '1f44a', '1f44b', '1f44c', '1f44d', '1f44e', '1f44f', '1f450', '1f451', '1f452', '1f453', '1f454', '1f455', '1f456', '1f457', '1f458', '1f459', '1f45a', '1f45b', '1f45c', '1f45d', '1f45e', '1f45f', '1f460', '1f461', '1f462', '1f463', '1f464', '1f465', '1f466', '1f467', '1f468', '1f469', '1f46a', '1f46b', '1f46c', '1f46d', '1f46e', '1f46f', '1f470', '1f471', '1f472', '1f473', '1f474', '1f475', '1f476', '1f477', '1f478', '1f479', '1f47a', '1f47b', '1f47c', '1f47d', '1f47e', '1f47f', '1f480', '1f481', '1f482', '1f483', '1f484', '1f485', '1f486', '1f487', '1f488', '1f489', '1f48a', '1f48b', '1f48c', '1f48d', '1f48e', '1f48f', '1f490', '1f491', '1f492', '1f493', '1f494', '1f495', '1f496', '1f497', '1f498', '1f499', '1f49a', '1f49b', '1f49c', '1f49d', '1f49e', '1f49f', '1f4a0', '1f4a1', '1f4a2', '1f4a3', '1f4a4', '1f4a5', '1f4a6', '1f4a7', '1f4a8', '1f4a9', '1f4aa', '1f4ab', '1f4ac', '1f4ad', '1f4ae', '1f4af', '1f4b0', '1f4b1', '1f4b2', '1f4b3', '1f4b4', '1f4b5', '1f4b6', '1f4b7', '1f4b8', '1f4b9', '1f4ba', '1f4bb', '1f4bc', '1f4bd', '1f4be', '1f4bf', '1f4c0', '1f4c1', '1f4c2', '1f4c3', '1f4c4', '1f4c5', '1f4c6', '1f4c7', '1f4c8', '1f4c9', '1f4ca', '1f4cb', '1f4cc', '1f4cd', '1f4ce', '1f4cf', '1f4d0', '1f4d1', '1f4d2', '1f4d3', '1f4d4', '1f4d5', '1f4d6', '1f4d7', '1f4d8', '1f4d9', '1f4da', '1f4db', '1f4dc', '1f4dd', '1f4de', '1f4df', '1f4e0', '1f4e1', '1f4e2', '1f4e3', '1f4e4', '1f4e5', '1f4e6', '1f4e7', '1f4e8', '1f4e9', '1f4ea', '1f4eb', '1f4ec', '1f4ed', '1f4ee', '1f4ef', '1f4f0', '1f4f1', '1f4f2', '1f4f3', '1f4f4', '1f4f5', '1f4f6', '1f4f7', '1f4f8', '1f4f9', '1f4fa', '1f4fb', '1f4fc', '1f4fd', '1f4ff', '1f500', '1f501', '1f502', '1f503', '1f504', '1f505', '1f506', '1f507', '1f508', '1f509', '1f50a', '1f50b', '1f50c', '1f50d', '1f50e', '1f50f', '1f510', '1f511', '1f512', '1f513', '1f514', '1f515', '1f516', '1f517', '1f518', '1f519', '1f51a', '1f51b', '1f51c', '1f51d', '1f51e', '1f51f', '1f520', '1f521', '1f522', '1f523', '1f524', '1f525', '1f526', '1f527', '1f528', '1f529', '1f52a', '1f52b', '1f52c', '1f52d', '1f52e', '1f52f', '1f530', '1f531', '1f532', '1f533', '1f534', '1f535', '1f536', '1f537', '1f538', '1f539', '1f53a', '1f53b', '1f53c', '1f53d', '1f549', '1f54a', '1f54b', '1f54c', '1f54d', '1f54e', '1f550', '1f551', '1f552', '1f553', '1f554', '1f555', '1f556', '1f557', '1f558', '1f559', '1f55a', '1f55b', '1f55c', '1f55d', '1f55e', '1f55f', '1f560', '1f561', '1f562', '1f563', '1f564', '1f565', '1f566', '1f567', '1f56f', '1f570', '1f573', '1f574', '1f575', '1f576', '1f577', '1f578', '1f579', '1f57a', '1f587', '1f58a', '1f58b', '1f58c', '1f58d', '1f590', '1f595', '1f596', '1f5a4', '1f5a5', '1f5a8', '1f5b1', '1f5b2', '1f5bc', '1f5c2', '1f5c3', '1f5c4', '1f5d1', '1f5d2', '1f5d3', '1f5dc', '1f5dd', '1f5de', '1f5e1', '1f5e3', '1f5e8', '1f5ef', '1f5f3', '1f5fa', '1f5fb', '1f5fc', '1f5fd', '1f5fe', '1f5ff', '1f645', '1f646', '1f647', '1f648', '1f649', '1f64a', '1f64b', '1f64c', '1f64d', '1f64e', '1f64f', '1f680', '1f681', '1f682', '1f683', '1f684', '1f685', '1f686', '1f687', '1f688', '1f689', '1f68a', '1f68b', '1f68c', '1f68d', '1f68e', '1f68f', '1f690', '1f691', '1f692', '1f693', '1f694', '1f695', '1f696', '1f697', '1f698', '1f699', '1f69a', '1f69b', '1f69c', '1f69d', '1f69e', '1f69f', '1f6a0', '1f6a1', '1f6a2', '1f6a3', '1f6a4', '1f6a5', '1f6a6', '1f6a7', '1f6a8', '1f6a9', '1f6aa', '1f6ab', '1f6ac', '1f6ad', '1f6ae', '1f6af', '1f6b0', '1f6b1', '1f6b2', '1f6b3', '1f6b4', '1f6b5', '1f6b6', '1f6b7', '1f6b8', '1f6b9', '1f6ba', '1f6bb', '1f6bc', '1f6bd', '1f6be', '1f6bf', '1f6c0', '1f6c1', '1f6c2', '1f6c3', '1f6c4', '1f6c5', '1f6cb', '1f6cc', '1f6cd', '1f6ce', '1f6cf', '1f6d0', '1f6d1', '1f6d2', '1f6d5', '1f6d6', '1f6d7', '1f6dc', '1f6dd', '1f6de', '1f6df', '1f6e0', '1f6e1', '1f6e2', '1f6e3', '1f6e4', '1f6e5', '1f6e9', '1f6eb', '1f6ec', '1f6f0', '1f6f3', '1f6f4', '1f6f5', '1f6f6', '1f6f7', '1f6f8', '1f6f9', '1f6fa', '1f6fb', '1f6fc', '1f7e0', '1f7e1', '1f7e2', '1f7e3', '1f7e4', '1f7e5', '1f7e6', '1f7e7', '1f7e8', '1f7e9', '1f7ea', '1f7eb', '1f7f0', '1f90c', '1f90d', '1f90e', '1f90f', '1f910', '1f911', '1f912', '1f913', '1f914', '1f915', '1f916', '1f917', '1f918', '1f919', '1f91a', '1f91b', '1f91c', '1f91d', '1f91e', '1f91f', '1f920', '1f921', '1f922', '1f923', '1f924', '1f925', '1f926', '1f927', '1f928', '1f929', '1f92a', '1f92b', '1f92c', '1f92d', '1f92e', '1f92f', '1f930', '1f931', '1f932', '1f933', '1f934', '1f935', '1f936', '1f937', '1f938', '1f939', '1f93a', '1f93c', '1f93d', '1f93e', '1f93f', '1f940', '1f941', '1f942', '1f943', '1f944', '1f945', '1f947', '1f948', '1f949', '1f94a', '1f94b', '1f94c', '1f94d', '1f94e', '1f94f', '1f970', '1f971', '1f972', '1f973', '1f974', '1f975', '1f976', '1f977', '1f978', '1f979', '1f97a', '1f97b', '1f97c', '1f97d', '1f97e', '1f97f', '1f9af', '1f9b0', '1f9b1', '1f9b2', '1f9b3', '1f9b4', '1f9b5', '1f9b6', '1f9b7', '1f9b8', '1f9b9', '1f9ba', '1f9bb', '1f9bc', '1f9bd', '1f9be', '1f9bf', '1f9c0', '1f9c1', '1f9c2', '1f9c3', '1f9c4', '1f9c5', '1f9c6', '1f9c7', '1f9c8', '1f9c9', '1f9ca', '1f9cb', '1f9cc', '1f9cd', '1f9ce', '1f9cf', '1f9d0', '1f9d1', '1f9d2', '1f9d3', '1f9d4', '1f9d5', '1f9d6', '1f9d7', '1f9d8', '1f9d9', '1f9da', '1f9db', '1f9dc', '1f9dd', '1f9de', '1f9df', '1f9e0', '1f9e1', '1f9e2', '1f9e3', '1f9e4', '1f9e5', '1f9e6', '1f9e7', '1f9e8', '1f9e9', '1f9ea', '1f9eb', '1f9ec', '1f9ed', '1f9ee', '1f9ef', '1f9f0', '1f9f1', '1f9f2', '1f9f3', '1f9f4', '1f9f5', '1f9f6', '1f9f7', '1f9f8', '1f9f9', '1f9fa', '1f9fb', '1f9fc', '1f9fd', '1f9fe', '1f9ff', '1fa70', '1fa71', '1fa72', '1fa73', '1fa74', '1fa75', '1fa76', '1fa77', '1fa78', '1fa79', '1fa7a', '1fa7b', '1fa7c', '1fa80', '1fa81', '1fa82', '1fa83', '1fa84', '1fa85', '1fa86', '1fa87', '1fa88', '1fa90', '1fa91', '1fa92', '1fa93', '1fa94', '1fa95', '1fa96', '1fa97', '1fa98', '1fa99', '1fa9a', '1fa9b', '1fa9c', '1fa9d', '1fa9e', '1fa9f', '1faa0', '1faa1', '1faa2', '1faa3', '1faa4', '1faa5', '1faa6', '1faa7', '1faa8', '1faa9', '1faaa', '1faab', '1faac', '1faad', '1faae', '1faaf', '1fab0', '1fab1', '1fab2', '1fab3', '1fab4', '1fab5', '1fab6', '1fab7', '1fab8', '1fab9', '1faba', '1fabb', '1fabc', '1fabd', '1fabf', '1fac0', '1fac1', '1fac2', '1fac3', '1fac4', '1fac5', '1face', '1facf', '1fad7', '1fad8', '1fad9', '1fada', '1fadb', '1fae0', '1fae1', '1fae2', '1fae3', '1fae4', '1fae5', '1fae6', '1fae7', '1fae8', '1faf0', '1faf1', '1faf2', '1faf3', '1faf4', '1faf5', '1faf6', '1faf7', '1faf8', '203c', '2049', '20e3', '2122', '2139', '2194', '2195', '2196', '2197', '2198', '2199', '21a9', '21aa', '231a', '231b', '2328', '23cf', '23e9', '23ea', '23eb', '23ec', '23ed', '23ee', '23ef', '23f0', '23f1', '23f2', '23f3', '23f8', '23f9', '23fa', '24c2', '25aa', '25ab', '25b6', '25c0', '25fb', '25fc', '25fd', '25fe', '2600', '2601', '2602', '2603', '2604', '260e', '2611', '2614', '2615', '2618', '261d', '2620', '2622', '2623', '2626', '262a', '262e', '262f', '2638', '2639', '263a', '2640', '2642', '2648', '2649', '264a', '264b', '264c', '264d', '264e', '264f', '2650', '2651', '2652', '2653', '265f', '2660', '2663', '2665', '2666', '2668', '267b', '267e', '267f', '2692', '2693', '2694', '2695', '2696', '2697', '2699', '269b', '269c', '26a0', '26a1', '26a7', '26aa', '26ab', '26b0', '26b1', '26bd', '26be', '26c4', '26c5', '26c8', '26ce', '26cf', '26d1', '26d3', '26d4', '26e9', '26ea', '26f0', '26f1', '26f2', '26f3', '26f4', '26f5', '26f7', '26f8', '26f9', '26fa', '26fd', '2702', '2705', '2708', '2709', '270a', '270b', '270c', '270d', '270f', '2712', '2714', '2716', '271d', '2721', '2728', '2733', '2734', '2744', '2747', '274c', '274e', '2753', '2754', '2755', '2757', '2763', '2764', '2795', '2796', '2797', '27a1', '27b0', '27bf', '2934', '2935', '2b05', '2b06', '2b07', '2b1b', '2b1c', '2b50', '2b55', '3030', '303d', '3297', '3299', 'fe82b']

  return (<>
    <h2>Modifier le filtre</h2>
    <h3>Titre</h3>
    <TextField model={filter} field="name" getter={recipeFilters} setter={recipeFilters.update} />
    <h3>Image</h3>
    <PublicImageField model={filter} field="image_src" defaultSrc={"question-mark.jpg"} getter={recipeFilters} setter={recipeFilters.update} />
    <br/>
    <h3>Emojis</h3>
    <div style={{fontSize: '2.5em'}}>
      <h3>Nourriture</h3>
      {foods.map((code,i) => <span key={i} dangerouslySetInnerHTML={{__html: `&#x${code};`}}/>)}
      <h3>Animaux</h3>
      {animals.map((code,i) => <span key={i} dangerouslySetInnerHTML={{__html: `&#x${code};`}}/>)}
      <h3>Smileys</h3>
      {smileys.map((code,i) => <span key={i} dangerouslySetInnerHTML={{__html: `&#x${code};`}}/>)}
      <h3>To remove</h3>
      {toRemove.map((code,i) => <span key={i} dangerouslySetInnerHTML={{__html: `&#x${code};`}}/>)}
      <h3>Symboles</h3>
      <h3>Autre</h3>
      {codes.map((code,i) => <span key={i} dangerouslySetInnerHTML={{__html: ` &#x${code}; `}}/>)}
    </div>
  </>)
}

const EditTagButton = ({tag, userTag}) => {
  let image = `/img/${tag.image_src || "question-mark.jpg"}`
  const handleClick = () => changePage({page: 3, filterId: tag.id})
  return (
    <div className="d-flex align-items-center" style={{padding: '5px 0'}}>
      <img src='/icons/arrows-move.svg' width="28" height="28" />
      <div className="me-3"/>
      <div className="clickable" onClick={handleClick}>
        <img className="me-1" src={image} width="60" height="60" />
        <b>#{tag.name || "Sans nom"}</b>
      </div>
      <div className="me-3"/>
      <DeleteConfirmButton id={`del-user-tag-${userTag.id}`} onDeleteConfirm={() => removeUserTag(userTag)} message="Je veux retirer cette étiquette?" />
    </div>
  )
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
          <EditTagButton tag={tag} userTag={userTag} />
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
            {userTagsC}
            {provided.placeholder}
          </div>
        </>)}
      </Droppable>
    </DragDropContext>
  </>)
}

const TagButton = ({image, title, handleClick}) => {
  return (
    <div style={{width: '200px', padding: '25px', display: "inline-block"}}>
      <button className="plain-btn d-flex flex-column align-items-center" onClick={handleClick}>
        <img src={image} width="150" height="150" />
        <b>{title}</b>
      </button>
    </div>
  )
}
const TagIndex = ({page, machines, recipeFilters, userTags}) => {

  const winWidth = useWindowWidth()
  let pl = winWidth > 800 ? 0 : (winWidth % 200)/2

  const buttons = userTags.map(userTag => {
    let tag = recipeFilters.find(t => t.id == userTag.tag_id)
    return <TagButton key={userTag.id} image={`/img/${tag.image_src || "question-mark.jpg"}`} title={tag.name || "Sans nom"} handleClick={() => changePage({page: PAGE_9, filterId: tag.id})} />
  })

  const machineButtons = machines.map(machine => {
    return <TagButton key={`machine-${machine.id}`} image='/img/robot.jpg' title={machine.name || "Heda"} handleClick={() => changePage({page: PAGE_10, machineId: machine.id})} />
  })

  // Pour recevoir des invités => (page suivantes, quelles restrictions => véganes)
  //<TagButton image="/img/recipes.jpg" title="Mes livres" handleClick={() => {window.location.href = my_books_path()}} />
  return (<>
    <div style={{maxWidth: "100vw", width: "800px", margin: "auto", paddingLeft: `${pl}px`, marginLeft: '-0.3em'}}>
      <div style={{width: "fit-content"}}>
        <TagButton image="/img/cooking.jpg" title="Mes recettes" handleClick={() => changePage({page: PAGE_6})} />
        {machineButtons}
        {buttons}
        <TagButton image="/icons/gear-gray.svg" title="Paramètres" handleClick={() => changePage({page: PAGE_4})} />
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
      <TagButton image="/img/calendar.jpg" title="Calendrier" handleClick={() => window.location.href = calendar_path(machine)} />
      <TagButton image="/img/blender.jpg" title="Mélanges" handleClick={() => changePage({page: PAGE_12, machineId: machine.id})} />
      <TagButton image="/img/bar_code.jpg" title="Inventaire" handleClick={() => changePage({page: PAGE_11, machineId: machine.id})} />
    
      <TagButton image="/img/jar.svg" title="Pots" handleClick={() => window.location.href = containers_path(machine)} />
      <TagButton image="/img/shopping_cart.jpg" title="Liste d'épicerie" handleClick={() => window.location.href = grocery_list_path(machine)} />
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
    window.history.pushState(updated, '', '?'+new URLSearchParams(updated).toString())
  }

  useEffect(() => {

    window.onpopstate = (event) => {
      setPage(event.state || getUrlParams())
      setIsSearching(false)
    }
  }, [])

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
    [PAGE_1]: <TagIndex {...{page, recipeFilters, userTags, machines}} />,
    [PAGE_2]: <TagCategorySuggestions {...{page, recipeFilters, suggestions, recipes}} />,
    [PAGE_3]: <EditFilter {...{page, recipeFilters}} />,
    [PAGE_4]: <EditUserTags {...{recipeFilters, userTags, page}} />,
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
    moveBtn = <img className="clickable" src={icon_path("arrow-up-square-white.svg")} width="32" style={{paddingLeft: "0.5em"}} onClick={goUp} />
  }

  // Pour recevoir des invités => (page suivantes, quelles restrictions => véganes)
  // Theme light:
  //   Background color: #e3f2fd
  //   Title color: #4f5458
  //   Icon color: black
  return (<>
    <nav style={{backgroundColor: '#212529', marginBottom: '0.5em', borderBottom: '1px solid #cee2f0'}}>
      <div style={{maxWidth: '800px', margin: 'auto', padding: '0.5em 0 0.5em 0'}}>
        <div className="float-start" style={{margin: '0.3em 0 0 0.5em'}}>
          {moveBtn}
        </div>
        <div className="float-end" style={{marginTop: '0.25em'}}>
          <img className="clickable" src={isSearching ? icon_path("x-lg.svg") : icon_path("search.svg")} width="24" onClick={() => {setIsSearching(!isSearching)}} style={{marginRight: '1em'}} />
          <div className="dropdown d-inline-block">
            <button className="plain-btn dropdown-toggle" type="button" id="dropdownUserButton" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style={{marginRight: '1em', color: 'white'}}>
              <img className="clickable" src={icon_path("person-fill-white.svg")} width="28"/>
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
        <div style={{margin: 'auto', width: 'fit-content', fontWeight: '500', fontSize: '1.5rem', color: '#f9f9f9'}} className="clickable" onClick={() => changePage(1)}>HedaCuisine</div>
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
