import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
//import { createRoot } from 'react-dom/client';

import { useCacheOrFetch, useCacheOrFetchHTML, useWindowWidth, Link, currentPathIs, currentPathIsRoot } from "./lib"
import { findRecipeKindForRecipeName } from "../lib"
import { RecipeList, RecipeIndex, duplicateRecipe } from './recipe_index'
import { changeUrl, ajax, normalizeSearchText, preloadImage, join, bindSetter, capitalize, isTrue } from "./utils"
import { localeHref2, getUrlParams, sortBy, sortByDate, shuffle } from "../utils"
import { icon_path, image_path, image_slug_variant_path } from './routes'
import {TextField, TextInput, CollectionSelect, ImageField, ImageSelector} from './form'
import { DeleteConfirmButton } from './components/delete_confirm_button'
import {RecipeEditor} from "./recipe_editor"
import {RecipeViewer, FavoriteButton} from "./recipe_viewer"
import {RecipeKindViewer} from "./show_recipe_kind"
import {KindViewer} from "./show_kind"
import { initHcu, useHcuState } from '../hcu'
import { UserThumbnailImage, RecipeThumbnailImage, RecipeSmallImage, RecipeMediumImage } from "./image"
import { t } from "../translate"
import { Carrousel } from './carrousel'
import {EditMix, ShowMix} from './recipe_editor'
import { AppSearch, useHiddenNavParam } from './main_search'
import { useRouter } from "./router"

const EditTag = ({tagId, tags}) => {
  const [name, setName] = useState('')
  //const filter = page && page.filterId ? recipeFilters.find(f => f.id == page.filterId) : null
  const tag = tagId ? tags.find(f => f.id == tagId) : null
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
const EditTags = ({tags}) => {

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

export const HomeTab = ({title, path}) => {
  const isActive = currentPathIs(path)
  return <>
    <li className="nav-item">
      <Link {...{path, className: 'nav-link', active: isActive}}>{title}</Link>
    </li>
  </>
}
const HomeTabs = ({machines}) => {
  //if (useHiddenNavParam()) {return ''}
      //<HomeTab {...{title: t('Tags'), path: '/c'}} />
  return <>
    <ul className="nav nav-tabs mb-3">
      <HomeTab {...{title: t('My_recipes'), path: '/'}} />
      <HomeTab {...{title: t('Users'), path: '/s'}} />
      <HomeTab {...{title: t('Explore'), path: '/x'}} />
      <HomeTab {...{title: t('Suggestions'), path: '/g'}} />
      {machines.map((machine) => (
        <HomeTab key={'m'+machine.id} {...{title: machine.name, path: '/m/'+machine.id}} />
      ))}
    </ul>
  </>
}

const RecipeCarrousel = ({items, isRecipeKind}) => {
  const preloadItem = (i) => {if (i.image_slug) {preloadImage('/imgs/small/'+i.image_slug)}}
  let p = isRecipeKind ? '/k/' : '/r/'
  return <>
    <Carrousel {...{items, preloadItem, maxItems: 3}}>{item => <>
      <Link {...{className: 'plain-link', path: p+item.id}}>
        <RecipeSmallImage {...{recipe: item}} />
        <div className="mt-1 mb-3" style={{lineHeight: 1}}>{item.name} {isRecipeKind ? <span className='d-inline-block fs-075'>{'('+item.recipe_count+' '+(item.recipe_count > 1 ? t('recipes') : t('recipe'))+')'}</span> : null}</div>
      </Link>
    </>}</Carrousel>
  </>
}

const UsersPage = ({}) => {

  const data = useCacheOrFetch(localeHref2('/fetch_explore_users', locale))

  if (!data) {return null}

  return <>
    {(data.users||[]).map(user => {
      return <div key={user.id}>
        <div className='d-flex align-items-end'>
          <UserThumbnailImage {...{user}} />
          <h2 className="fs-14 bold">{user.name}</h2>
        </div>
        <RecipeCarrousel {...{items: data.recipesByUserId[user.id]}}/>
      </div>
    })}
  </> 
}

const ExplorePage = ({}) => {

  const data = useCacheOrFetch(localeHref2('/fetch_explore', locale))
  const [kinds, setKinds] = useState([])

  useEffect(() => {
    if (data) {setKinds(shuffle(data.kinds||[]))}
  }, [data])

  if (!data) {return null}

  return <>
    {kinds.map(kind => {
      return <div key={kind.id}>
        <h2 className="fs-14 bold"><a href={'/d/'+kind.id} className="plain-link">{kind.name}</a></h2>
        <RecipeCarrousel {...{items: data.recipeKindsByAncestorId[kind.id], isRecipeKind: true}}/>
      </div>
    })}
  </> 
}

const QuestionPage = ({title, answers, answer}) => {
  return <>
    <br/>
    <h2 className='text-center'>{title}?</h2>
    <br/>
    <div className='m-auto' style={{width: 'fit-content'}}>
      {answers.map(a =>
        <button key={a} type="button" className="btn btn-outline-primary d-block m-2" style={{minWidth: '10em'}} onClick={() => answer(a)}>{a}</button>
      )}
    </div>
  </>
}

const SuggestionsPage = ({recipeKinds}) => {

  const [answers, setAnswers] = useState([])

  let randomRecipes = shuffle(recipeKinds.filter(k => k.recipe_count))

  let questions = [
    {title: 'Quoi cuisiner', answers: ['Une entrée', 'Un repas', 'Un dessert', "Autre", "Peu importe"]},
    {title: 'Quelle quantité', answers: ['Petite', 'Moyenne', "Grosse", 'Peu importe']},
    {title: 'Difficulté', answers: ['Simple', 'Normale', 'Gastronomique', 'Peu importe']},
    {title: 'Pour quand', answers: ['Tout de suite', 'Bientôt', 'Peu importe']},
  ]
  
  if (answers.length >= questions.length) {return <h1>DONE</h1>}

  const answer = (response) => {
    setAnswers([...answers, response]) 
  }

  let question = questions[answers.length]
  return <>
    <QuestionPage {...{...question, answer}} />
    <br/><br/>
    <h2 className="fs-14 bold">{t('Suggestions')}</h2>
    <RecipeCarrousel {...{items: randomRecipes.slice(0,10), isRecipeKind: true}}/>
  </>
}

const ShowKind = ({kindId, locale}) => {

  const [kind, setKind] = useState(null)
  const [kinds, setKinds] = useState(null)
  const [recipeKinds, setRecipeKinds] = useState(null)
  const [ancestors, setAncestors] = useState(null)

  useEffect(() => {
    ajax({url: localeHref2('/fetch_kind/'+kindId, locale), type: 'GET', success: (result) => {
      setKind(result.kind)
      setKinds(result.kinds)
      setRecipeKinds(result.recipeKinds)
      setAncestors(result.ancestors)
    }})
  }, [kindId])
  return <>
    <KindViewer {...{kind, ancestors, kinds, recipeKinds}} />
  </>
}

const ShowRecipeKind = ({user, favoriteRecipes, recipeKindId, ...props}) => {

  const [recipeKind, setRecipeKind] = useState(null)
  const [kindRecipes, setKindRecipes] = useState(null)
  const [kindAncestors, setKindAncestors] = useState(null)

  useEffect(() => {
    ajax({url: localeHref2('/fetch_recipe_kind/'+recipeKindId, props.locale), type: 'GET', success: (result) => {
      setKindAncestors(result.kindAncestors)
      setRecipeKind(result.recipeKind)
      setKindRecipes(result.recipes)
    }})
  }, [recipeKindId])

  const recipeButtons = (recipe) => {
    if (user.id == recipe.user_id) {return null}
    const favorite = favoriteRecipes?.find(f => f.recipe_id == recipe.id)
    return <>
      <FavoriteButton {...{recipe, user, favorite}} className='plain-btn' width='32' />
      <button type="button" className="plain-btn" onClick={() => duplicateRecipe(recipe)}>
        <img style={{width: '1.8em'}} src="/icons/pencil-plus.svg" className="ms-2" title={t('Copy_and_edit')} />
      </button> 
    </>
  }
        //<div className="dropdown d-inline-block">
        //  <img style={{width: '1.8em'}} src="/icons/three-dots-vertical.svg" className="clickable ms-1" data-bs-toggle="dropdown" />
        //  <div className="dropdown-menu">
        //    <button type="button" className="dropdown-item" onClick={() => duplicateRecipe(recipe)}>{t('Copy_and_edit')}</button> 
        //  </div>
        //</div>

  return <>
    <RecipeKindViewer {...{...props, recipeKind, recipes: kindRecipes, kindAncestors, recipeButtons}} />
  </>
}

const ShowRecipe = (props) => {
  return <>
    <RecipeViewer {...props} />
  </>
}

const EditRecipe = (props) => {

  const recipeId = props.recipeId
  const recipe = props.recipes.find(e => e.id == recipeId)
  useEffect(() => {
    if (!recipe || recipe.user_id != props.user.id) {
      changeUrl('/r/'+recipeId)
    }
  }, [props.recipes])

  return <>
    <div style={{marginTop: '-1rem'}}>
      <Link path={'/r/'+recipeId} className="m-2 btn btn-primary">{t('Ok')}</Link>
    </div>
    <RecipeEditor {...{recipe, ...props}} />
    <br/><br/><br/><br/><br/><br/><br/><br/>
  </>
}

const MixIndex = ({machineId, machines, mixes, machineFoods}) => {

  const machine = machines.find(m => m.id == machineId)
  const currentMachineFoods = machineFoods.filter(m => m.machine_id == machineId)

  const createMix = () => {
    ajax({url: mixes_path(), type: 'POST', data: {}, success: (mix) => {
      mixes.update([...mixes, mix])
      changeUrl('/m/'+machine.id+'/e/'+mix.id)
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
      <span className="clickable" onClick={() => changeUrl('/m/'+machine.id+'/s/'+mix.id)}>{mix.name || 'Sans nom'}</span>
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

const Inventory = ({machineId, machines, containerQuantities, machineFoods, foods, containerFormats}) => {

  const machine = machines.find(m => m.id == machineId)
  const currentMachineFoods = machineFoods.filter(m => m.machine_id == machineId)

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

const HedaIndex = ({machineId, machines}) => {

  const machine = machines.find(m => m.id == machineId)
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
  
  let toCookList = []
  props.favoriteRecipes.forEach(fav => {
    let recipe = props.recipes.find(r => r.id == fav.recipe_id)
    if (fav.list_id == 1) { toCookList.push({recipe, fav}) }
  })
  toCookList = sortBy(toCookList, (r => new Date(r.fav.updated_at).getTime())).reverse()

  return (<>
    {toCookList.length < 0 ? null : <>
      <h2 className="fs-14 bold">{t('My_list')}</h2>
      <RecipeCarrousel {...{items: toCookList.map(r => r.recipe)}}/>
    </>}
    <div className="d-flex gap-20 align-items-center">
      <h2>{t('My_recipes')}</h2>
      <Link path='/n' className="btn btn-outline-primary btn-sm">{t('New_recipe')}</Link>
    </div>
    <RecipeIndex {...props} loading={false} />
  </>)
}

const NewRecipe = ({recipeKinds}) => {

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
      changeUrl('/e/'+created.id)
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

export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // Update state so the next render will show the fallback UI.    
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // TODO: Log the error to an error reporting service
    //logErrorToMyService(error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <>
        <div className="trunk text-center">
          <br/><br/><br/>
          <img src="/sorry.jpg" style={{height: '50vh', margin: 'auto'}}/>
          <br/><br/><br/>
          <h1 className="h003">{t('Sorry_error')}</h1>
        </div>
      </>
    }
    return this.props.children;
  }
}

export const App = () => {
  
  const [isSearching, setIsSearching] = useState(false)

  if (!window.hcu) {initHcu()}

  const suggestions = useHcuState(gon.suggestions.filter(r => r.tag_id), {tableName: 'suggestions'}) // FIXME: Fix the data. tag_id is mandatory...
  const favoriteRecipes = useHcuState(gon.favorite_recipes, {tableName: 'favorite_recipes'})
  const machineFoods = useHcuState(gon.machine_foods, {tableName: 'machine_foods'})
  const mixes = useHcuState(gon.mixes, {tableName: 'mixes'})
  const recipes = useHcuState(gon.recipes, {tableName: 'recipes'})
  //const recipes = useHcuState(gon.recipe_kinds, {tableName: 'recipe_kinds'})
  const [recipeKinds,] = useState(gon.recipe_kinds)
  const images = useHcuState(gon.images, {tableName: 'images'})
  const tags = useHcuState(gon.tags, {tableName: 'tags'})
  //const notes = gon.notes
  const containerQuantities = useHcuState(gon.container_quantities, {tableName: 'container_quantities'})
  const containerFormats = useHcuState(gon.container_formats, {tableName: 'container_formats'})
  const foods = useHcuState(gon.foods, {tableName: 'foods'})
  const machines = useHcuState(gon.machines, {tableName: 'machines'})
  const friendsRecipes = gon.friends_recipes//.filter(r => !recipeIds.includes(r.id))
  //const recipeSuggestions = gon.recipe_suggestions
  const [users,] = useState(gon.users)
  const [user,] = useState(gon.user)
  window.locale = user.locale

  const routes = [
    {match: "/s", elem: () => <UsersPage />},
    {match: "/g", elem: () => <SuggestionsPage {...{recipeKinds}} />},
    {match: "/x", elem: () => <ExplorePage />},
    {match: "/c", elem: () => <EditTags {...{tags}} />},
    {match: "/n", elem: () => <NewRecipe {...{recipeKinds}} />},
    {match: "/r/:id", elem: ({id}) =>
      <ShowRecipe {...{recipeId: id, recipes, mixes, favoriteRecipes, recipeKinds, images, user, users, suggestions, tags}} />
    },
    {match: "/k/:id", elem: ({id}) =>
      <ShowRecipeKind {...{recipeKindId: id, recipes, recipeKinds, images, locale, user, favoriteRecipes}} />
    },
    {match: "/d/:id", elem: ({id}) =>
      <ShowKind {...{kindId: id, locale}} />
    },
    {match: "/t/:id", elem: ({id}) => 
      <EditTag {...{tagId: id, tags}} />
    },
    {match: "/e/:id", elem: ({id}) => 
      <EditRecipe {...{recipeId: id, recipes, mixes, user, users, recipeKinds, images, machineFoods, favoriteRecipes, locale}} />
    },
    {match: "/m/:id/i", elem: ({id}) => 
      <Inventory {...{machineId: id, machines, machineFoods, containerQuantities, foods, containerFormats}} />
    },
    {match: "/m/:id/l", elem: ({id}) =>
      <MixIndex {...{machineId: id, machines, machineFoods, mixes}} />
    },
    {match: "/m/:machineId/s/:id", elem: ({id, machineId}) =>
      <ShowMix {...{machineId: machineId, mixId: id, recipes, machines, mixes, machineFoods}} />,
    },
    {match: "/m/:machineId/e/:id", elem: ({id, machineId}) => 
      <EditMix {...{machineId: machineId, mixId: id, recipes, machines, mixes, machineFoods}} />
    },
    {match: "/m/:id", elem: ({id}) => 
      <HedaIndex {...{machineId: id, machines}} />,
    },
  ]
  
  const defaultElement = (params) => <MyRecipes {...{recipes, suggestions, favoriteRecipes, tags, mixes, recipeKinds, user, images}} />

  const {elem,idx} = useRouter(routes, defaultElement)

  const [_csrf, setCsrf] = useState('')
  useEffect(() => {
    setCsrf(document.querySelector('[name="csrf-token"]').content)
  }, [])

  let otherProfiles = users.filter(u => u.id != user.id)

    //<div className={(!page.page || page.page === 1) ? "wide-trunk" : "trunk"}>
  return (<>
    <AppSearch {...{user, otherProfiles, _csrf, recipes, friendsRecipes, users, recipeKinds}} />
    <div className="trunk">
      <HomeTabs machines={machines} />
      <AppErrorBoundary key={'err-boundary-'+idx}>
        {elem}
      </AppErrorBoundary>
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
//

  // [PAGE_1]: <TagIndex {...{page, machines, tags, images}} />,
  //[PAGE_2]: <TagCategorySuggestions {...{suggestions, recipes}} />,
  //5: <TrainFilter recipeFilters={recipeFilters} />,
  //[PAGE_7]: <MyBooks />,
  //[PAGE_8]: <TagEditAllCategories />,
  //[PAGE_9]: <SuggestionsIndex {...{tags, suggestions, recipes, recipeKinds}} />,
//
//// The advantage of using this instead of the number is if I need to search and to refactor, I can easy
//const PAGE_1 = 1 // HomePage, TagIndex no more
//const PAGE_2 = 2 // TagCategorySuggestions
//const PAGE_3 = 3 // EditTag
//const PAGE_4 = 4 // EditTags
////const PAGE_5 = 5 // TrainFilter
//const PAGE_6 = 6 // MyRecipes
//const PAGE_7 = 7 // MyBooks
//const PAGE_8 = 8 // TagEditAllCategories
//const PAGE_9 = 9 // SuggestionsIndex
//const PAGE_10 = 10 // HedaIndex
//const PAGE_11 = 11 // Inventory
//const PAGE_12 = 12 // MixIndex
//const PAGE_13 = 13 // ShowMix
//const PAGE_14 = 14 // EditMix
//const PAGE_15 = 15 // ShowRecipe
//const PAGE_16 = 16 // EditRecipe
//const PAGE_17 = 17 // NewRecipe
//const PAGE_18 = 18
//const PAGE_19 = 19
//const PAGE_20 = 20
  //
//
//
//const HomePage = ({tags, recipes, suggestions, favoriteRecipes, recipeKinds}) => {
//
//  //let favList = {title: t("Favorites"), records: []}
//  let toCookList = {title: t('To_cook_soon'), records: []}
//  let toTryList = {title: t('To_try'), records: []}
//  favoriteRecipes.forEach(fav => {
//    let recipe = recipes.find(r => r.id == fav.recipe_id)
//    if (fav.list_id == 1) { toCookList.records.push({recipe, fav}) }
//    else if (fav.list_id == 2) { toTryList.records.push({recipe, fav}) }
//    //else { favList.records.push({recipe, fav}) }
//  })
//  toCookList.records = sortBy(toCookList.records, (r => new Date(r.fav.updated_at).getTime())).reverse()
//  toTryList.records = sortBy(toTryList.records, (r => new Date(r.fav.updated_at).getTime())).reverse()
//  const lists = [toCookList, toTryList]
//  //const lists = [toCookList, favList, toTryList]
//
//  let suggestionsByTagId = suggestions.reduce((acc, suggestion) => {
//    let prev = acc[suggestion.tag_id]
//    acc[suggestion.tag_id] = !prev ? [suggestion] : [...prev, suggestion]
//    return acc
//  }, {})
//  const sTags = sortBy(tags, "position")
//    
//  let randomRecipes = shuffle(recipeKinds.filter(k => k.recipe_count))
//
//  //<h2 className="fs-12 italic gray">{t('Suggestions_for_you')}</h2>
//  return <>
//    <h2 className="fs-14 italic gray">{t('Suggestions_for_you')}</h2>
//    <RecipeCarrousel {...{items: randomRecipes.slice(0,10), isRecipeKind: true}}/>
//    {lists.map(list => {
//      if (list.records.length <= 0) {return ''}
//      return <div key={list.title}>
//        <h2 className="fs-14 bold">{list.title}</h2>
//        <RecipeCarrousel {...{items: list.records.map(r => r.recipe)}}/>
//      </div>
//    })}
//    {sTags.map(tag => {
//      if (!suggestionsByTagId[tag.id]) {return ''}
//      const unsortedItems = suggestionsByTagId[tag.id].map(sugg => recipes.find(r => r.id == sugg.recipe_id))
//      const itemsWithImages = unsortedItems.filter(r => r.image_slug)
//      const itemsWithoutImages = unsortedItems.filter(r => !r.image_slug)
//      const items = [...shuffle(itemsWithImages), ...shuffle(itemsWithoutImages)]
//      return <div key={tag.id}>
//        <h2 className="fs-14 bold">{tag.name}</h2>
//        <RecipeCarrousel {...{items}}/>
//      </div>
//    })}
//    <h2 className="fs-14 italic gray">{t('Suggestions_for_you')}</h2>
//    <RecipeCarrousel {...{items: randomRecipes.slice(11,20), isRecipeKind: true}}/>
//    <h2 className="fs-14 italic gray">{t('Suggestions_for_you')}</h2>
//    <RecipeCarrousel {...{items: randomRecipes.slice(21,30), isRecipeKind: true}}/>
//  </> 
//}
