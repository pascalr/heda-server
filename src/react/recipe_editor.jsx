import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Autosuggest from 'react-autosuggest'
import {Block, Inline, InlineBlock, Row, Col, InlineRow, InlineCol, Grid} from 'jsxstyle'

import Quantity from './models/quantity'
import { ajax } from "./utils"
import { DeleteConfirmButton } from './components/delete_confirm_button'
import { Tiptap, BubbleTiptap } from './tiptap'
import {AutocompleteInput, updateRecord, TextField, CollectionSelect} from './form'
import { combineOrderedListWithHeaders, parseIngredients, parseIngredientsOldFormat } from './lib'
import {EditRecipeImageModal} from './modals/recipe_image'
import {PasteIngredientsButton} from './modals/paste_ingredients'
import {EditMix} from './app'

import {paste_ingredients_recipes_path, recipe_recipe_ingredients_path, recipe_recipe_ingredient_path, food_path, recipe_ingredient_sections_path, recipe_ingredient_section_path, recipe_recipe_notes_path, move_ing_recipe_path, recipe_path, recipe_recipe_note_path, image_variant_path, mixes_path, mix_path } from './routes'

const InstructionsShortcuts = props => (
  <>
    <button type="button" className="btn btn-small dropdown-toggle" data-bs-toggle="collapse" data-bs-target="#show-shortcuts">
      Voir les racourcis claviers
    </button>
    <div className="collapse" id="show-shortcuts">
      <h2>Racourcis claviers</h2>
      <ul>
        <li><b>#</b>: Commencer une ligne avec «#» pour chaque étape de la recette.</li>
        <li><b>$</b>: Commencer une ligne avec «$» pour un grand titre.</li>
        <li><b>$$</b>: Commencer une ligne avec «$$» pour un moyen titre.</li>
        <li><b>$$$</b>: Commencer une ligne avec «$$$» pour un petit titre.</li>
        <li><b>/</b>: Commencer une ligne avec «/» pour faire un paragraph en italique.</li>
        <li><b>{"{3}"}</b>: Afficher l'ingrédient 3</li>
        <li><b>{"{3-5}"}</b>: Afficher les ingrédients 3, 4 et 5</li>
        <li><b>{"{3,5}"}</b>: Afficher les ingrédients 3 et 5</li>
        <li><b>{"{3;}"}</b>: TODO: Afficher le nombre 3 qui scale avec la recette</li>
        <li><b>{"{3;pomme}"}</b>: TODO: Afficher la quantité 3 pomme qui scale avec la recette</li>
        <li><b>{"{2;pomme,3-5}"}</b>: TODO: Afficher la quantité 3 pomme qui scale avec la recette et les ingrédients 3, 4 et 5.</li>
        <li><b>[1]</b>: TODO: Lien vers la note 1</li>
        <li><b>[1;Section name]</b>: TODO: Lien vers la section de l'article</li>
        <li><b>[note: 1]</b></li>
        <li><b>[link_note: 1]</b></li>
        <li><b>[recipe: 100]</b></li>
        <li><b>[food: 100]</b></li>
        <li><b>[url: "http://www.hedacuisine.com/"]</b></li>
        <li><b>[label: "home", url: "http://www.hedacuisine.com/"]</b></li>
        <li><b>[img: 10]</b></li>
      </ul>
    </div>
  </>
)

const NewIngInputField = props => {

  const [value, setValue] = useState('')
  const [qty, setQty] = useState('')
  const [newlyAdded, setNewlyAdded] = useState(true);

  //const foodInputField = useRef(null);
  const quantityInputField = useRef(null);

  const id = "autocomplete-form"

  useEffect(() => {
    if (newlyAdded) {
      quantityInputField.current.focus()
      setNewlyAdded(false)
    }
  }, [newlyAdded]);

  const inputFieldProps = {
    placeholder: 'Sélectionner un aliment',
    value,
    id: 'newRecipeIngredientRawFood',
    onChange: (e, {newValue}) => setValue(newValue),
    //ref: foodInputField,
  };

  const postNewIngredient = (data) => {
      
    ajax({url: recipe_recipe_ingredients_path(gon.recipe), type: 'POST', data: data, success: (ingredient) => {
      window.recipe_editor.current.addIng(ingredient)
      setValue(''); setQty('');
      quantityInputField.current.focus()
    }})
  }

  //const addIngredient = (event, {suggestion, suggestionValue, suggestionIndex, sectionIndex, method}) => {
  //  let data = new FormData()
  //  data.append('recipe_ingredient[raw]', qty)
  //  data.append('recipe_ingredient[food_id]', suggestion.id)
  //  postNewIngredient(data)
  //}

  const handleSubmit = (e) => {
    e.preventDefault()
    let data = new FormData()
    data.append('recipe_ingredient[raw]', qty)
    data.append('recipe_ingredient[raw_food]', e.currentTarget.elements.raw_food.value)
    postNewIngredient(data)
  }

  const onSelect = (e, term, item) => {
    e.preventDefault()
    let data = new FormData()
    let form = document.getElementById(id)
    data.append('recipe_ingredient[raw]', form.elements.raw.value)
    let f = props.foods.find(e => e.id == item.dataset.id)
    data.append('recipe_ingredient[raw_food]', f.name)
    postNewIngredient(data)
  }

  return (<>
    <form id={id} onSubmit={handleSubmit}>
      <Row gap="0.5em;">
        <input type="text" name="raw" size="8" style={{border: "none", borderBottom: "1px dashed #444"}} value={qty} onChange={(e) => setQty(e.target.value)} ref={quantityInputField} />
        {' '}
        de
        {' '}
        <input type="hidden" name="food_id" value="" />
        <AutocompleteInput name="raw_food" choices={props.foods} onSelect={onSelect} />
        <input type="submit" value="Ajouter" />
      </Row>
    </form>
  </>)
}

const VisualState = {
  CLOSED: 1,
  EXPANDING: 2,
  EXPANDED: 3,
}

const EditableIngredient = ({ingredient, itemNb, foods, mixes}) => {

  if (ingredient == null) {return null;}

  //const ingUrl = recipe_recipe_ingredient_path({id: ingredient.recipe_id}, ingredient)
  const ingUrl = ''
  const removeIngredient = (evt) => {
    //ajax({url: ingUrl, type: 'DELETE', success: () => {
    //  window.recipe_editor.current.removeIng(ingredient)
    //}})
  }

  let f = ingredient.food_id ? foods.find(e => e.id == ingredient.food_id) : null
  let mix = mixes.find(e => e.recipe_id == gon.recipe.id)

  let moveIngToMix = () => {
    //let ins = mix.instructions+';ADD,'+ingredient.raw+','+(f ? f.name : ingredient.name)
    //ajax({url: mix_path(mix), type: 'PATCH', data: {mix: {instructions: ins}}, success: (mix) => {
    //  mixes.update(mixes.map(e => e.id == mix.id ? mix : e))
    //  removeIngredient()
    //}})
  }

  return (
    <Row alignItems="center" gap="5px">
      <span style={{padding: "0 10px 0 0"}}><b>{itemNb}.</b></span>
      <TextField model={ingredient} field="qty" size="8" className="editable-input" />
      de{/*" de " ou bien " - " si la quantité n'a pas d'unité => _1_____ - oeuf*/}
      {f ? <a href={food_path(f)}>{f.name}</a> : <div>{ingredient.label}</div>}
      <Block flexGrow="1" />
      {mix ? <img className="clickable" style={{marginRight: '0.4em'}} src="/icons/arrow-down-up.svg" width="16" height="16" onClick={moveIngToMix}></img> : '' }
      <DeleteConfirmButton id={`ing-${ingredient.key}`} onDeleteConfirm={removeIngredient} message="Je veux enlever cet ingrédient?" />
    </Row>
  )
}

const Toggleable = ({children, ...props}) => {
  const [showToggled, setShowToggled] = useState(false)

  if (children.length <= 1) {throw "Toggleable requires 2 or 3 children. The first is the toggled. The second is the toggler. The third, if present, is the toggler active."}

  // TODO: Allow to be a div or link instead of a button? Who cares for now.
  return (<div {...props}>
    {showToggled ? children[0] : null}
    <button className="plain-btn" onClick={() => setShowToggled(!showToggled)}>
      {!showToggled ? children[1] : (children.length >= 2 ? children[2] : children[1])}
    </button>
  </div>)
}

//  constructor(props) {
//    super(props);
//    let noteIds = gon.recipe.notes ? Object.values(gon.recipe.notes).sort((a,b) => a.item_nb - b.item_nb).map(ing => ing.id) : []
//    let recipe_image = gon.recipe.image_id ? gon.images.find(e => e.id == gon.recipe.image_id) : {}
//    this.state = {
//      recipe: gon.recipe,
//      recipe_image: recipe_image,
//      name: gon.recipe.name,
//      ingredients: gon.recipe_ingredients.filter(e => e.recipe_id == gon.recipe.id) || [],
//      noteIds: noteIds,
//      ingredient_sections: props.ingredientSections.filter(e => e.recipe_id == gon.recipe.id) || [],
//      toolIds: Object.keys(gon.recipe.tools || []),
//      instructionsSlave: gon.recipe.complete_instructions,
//      showImageModal: false,
//    };
//    this.handleDropIng = this.handleDropIng.bind(this);
//    this.appendIngredientSection = this.appendIngredientSection.bind(this)
//    this.addIng = this.addIng.bind(this)
//    this.removeIng = this.removeIng.bind(this)
//    this.removeIngSection = this.removeIngSection.bind(this)
//    this.appendNote = this.appendNote.bind(this)
//  }

  //componentDidUpdate(prevProps, prevState) {
  //  if (prevState.ingredients !== this.state.ingredients) {
  //    gon.recipe_ingredients = this.state.ingredients
  //  }
  //}

  //swapIng(dragIndex, dropIndex) {
  //  let swappedIngs = swapArrayPositions(this.state.ings, dragIndex, dropIndex);
  //  this.setState({ings: swappedIngs})
  //}

function addIng(ingredient) {
  //console.log("added ingredient ", ingredient)
  //this.setState({ingredients: [...this.state.ingredients, ingredient]})
}
function removeIng(ing) {
  //console.log("this.state.ingredients", this.state.ingredients)
  //let ings = this.state.ingredients.filter(item => item.id != ing.id)
  //console.log("ings", ings)
  //this.setState({ingredients: ings})
}

function appendIngredientSection() {
  //ajax({url: recipe_ingredient_sections_path(gon.recipe), type: 'POST', data: {}, success: (section) => {
  //  this.setState({ingredient_sections: [...this.state.ingredient_sections, section]})
  //}})
}

function appendNote() {
  //ajax({url: recipe_recipe_notes_path(gon.recipe), type: 'POST', data: {}, success: (recipe_note) => {
  //  if (!gon.recipe.notes) {gon.recipe.notes = {}}
  //  gon.recipe.notes[recipe_note.id] = recipe_note
  //  this.setState({noteIds: [...this.state.noteIds, recipe_note.id]})
  //}})
}

function handleDropIng(ingItems, droppedItem) {

  const getClosestItemNb = (index) => {
    for (let i = index; i < ingItems.length; i++) {
      if (ingItems[i].table_name == "recipe_ingredients") {
        return ingItems[i].item_nb
      }
    }
    return this.state.ingredients.length
  }

  console.log('Handle drop ing')
  // Ignore drop outside droppable container
  if (!droppedItem.destination) return;
  let source = getClosestItemNb(droppedItem.source.index)-1
  let destination = getClosestItemNb(droppedItem.destination.index)-1
  let droppedRecord = ingItems[droppedItem.source.index]
  //console.log("droppedRecord", droppedRecord)
  //console.log("droppedItem", droppedItem)
  //console.log("source", source)
  //console.log("destination", destination)
  if (droppedRecord.table_name == "recipe_ingredients") {
    console.log("dropping recipe ingredient")
    var updatedList = [...this.state.ingredients];
    const [reorderedItem] = updatedList.splice(source, 1);
    updatedList.splice(destination, 0, reorderedItem);

    let data = new FormData()
    data.append('ing_id', droppedRecord.id)
    data.append('position', destination+1)
    ajax({url: move_ing_recipe_path(gon.recipe), type: 'PATCH', data: data})
    for (let i = 0; i < updatedList.length; i++) {
      updatedList[i].item_nb = i+1
    }
    this.setState({ingredients: updatedList})
  } else {
    var others = [...this.state.ingredient_sections].filter(i => i.id != droppedRecord.id);
    droppedRecord.before_ing_nb = droppedItem.source.index < droppedItem.destination.index ? destination+2 : destination+1
    console.log("dropping ingredient section at ", droppedRecord.before_ing_nb)
    let data = new FormData()
    data.append('ingredient_section[before_ing_nb]', droppedRecord.before_ing_nb)
    ajax({url: recipe_ingredient_section_path({id: droppedRecord.recipe_id}, droppedRecord), type: 'PATCH', data: data})
    this.setState({ingredient_sections: [...others, droppedRecord]})
  }
}

function removeIngSection(section) {
  //ajax({url: recipe_ingredient_section_path({id: section.recipe_id}, section), type: 'DELETE', success: () => {
  //  let sections = this.state.ingredient_sections.filter(i => i.id != section.id)
  //  this.setState({ingredient_sections: sections})
  //}})
}

export const RecipeEditor = ({recipeId, page, userRecipes, favoriteRecipes, machines, mixes, machineFoods, foods, recipes, ingredientSections, recipeKinds, images, users, editable, user}) => {

  const [showImageModal, setShowImageModal] = useState(false)

  const recipe = recipes.find(e => e.id == recipeId)
  gon.recipe = recipe // FIXME: This is really ugly

  if (!recipe || recipe.user_id != user.id) {window.hcu.changePage({page: 15, recipeId: recipeId}); return '';}

  const ingredients = parseIngredients(recipe.ingredients)
  gon.recipe_ingredients = parseIngredientsOldFormat(recipe.ingredients)
  //const ingredients = recipeIngredients.filter(e => e.recipe_id == recipeId) || []
  const ingredient_sections = ingredientSections.filter(e => e.recipe_id == recipeId) || []
  const recipe_kind = recipeKinds.find(k => k.id == recipe.recipe_kind_id)
  const recipe_image = recipe.image_id ? images.find(e => e.id == recipe.image_id) : {}
  let recipeKindImage = recipe_kind && recipe_kind.image_id ? images.find(e => e.id == recipe_kind.image_id) : null
  const image = recipe.use_personalised_image ? recipe_image : recipeKindImage
  const imagePath = image ? image_variant_path(image, 'medium') : "/img/default_recipe_01.png"
  const mix = mixes.find(m => m.recipe_id == recipe.id)

  let ingItems = combineOrderedListWithHeaders(ingredients, ingredient_sections, header => header.before_ing_nb)
  ingItems = ingItems.concat(ingredient_sections.filter(s => s.before_ing_nb > ingredients.length))
  const renderedIngItems = []
  for (let i=0; i < ingItems.length; i++) {
    let item = ingItems[i]
    if (item.table_name == "ingredient_sections") {
      let sectionId = 'section-'+item.id
      renderedIngItems.push(<Draggable key={sectionId} draggableId={sectionId} index={i}>
        {(provided) => (
          <div className="item-container" ref={provided.innerRef} {...provided.dragHandleProps} {...provided.draggableProps}>
            <h3 style={{margin: "0", padding: "0.5em 0 0.2em 0"}}>
              <TextField model={item} field="name" className="plain-input" url={recipe_ingredient_section_path({id: item.recipe_id}, {id: item.id})} />
              <span style={{margin: "0 0.2em"}}>
                <DeleteConfirmButton id={`del-${sectionId}`} onDeleteConfirm={() => removeIngSection(item)} message="Je veux enlever ce titre?" />
              </span>
            </h3>
          </div>
        )}
      </Draggable>)
    } else {
      renderedIngItems.push(<Draggable key={item.key} draggableId={item.key} index={i}>
        {(provided) => (
          <div className="item-container" ref={provided.innerRef} {...provided.dragHandleProps} {...provided.draggableProps}>
            <li className="list-group-item">
              {<EditableIngredient ingredient={item} itemNb={i+1} {...{mixes, foods}} />}
            </li>
          </div>
        )}
      </Draggable>)
    }
  }

  const IngredientList = 
    <ul className="list-group" style={{maxWidth: "800px"}}>
      <DragDropContext onDragEnd={(droppedItem) => handleDropIng(ingItems, droppedItem)}>
        <Droppable droppableId="list-container">
          {(provided) => (
            <div className="list-container" {...provided.droppableProps} ref={provided.innerRef}>
              {renderedIngItems}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <Row>
        <Toggleable style={{float: "left"}}>
          <li key={99999} className="list-group-item" style={{height: "37.2px"}}>
            <NewIngInputField {...{foods}} />
          </li>
          <img src="/icons/plus-circle.svg" style={{width: "2.5rem", padding: "0.5rem"}}/>
          <img src="/icons/minus-circle.svg" style={{width: "2.5rem", padding: "0.5rem"}}/>
        </Toggleable>
        <PasteIngredientsButton recipe={recipe} ingredients={ingredients} />
      </Row>
    </ul>

  //const NoteList = this.state.noteIds.map(id => {
  const NoteList = [].map(id => {
    const note = gon.recipe.notes[id]

    const removeNote = (evt) => {
      ajax({url: recipe_recipe_note_path(gon.recipe, note), type: 'DELETE', success: () => {
        let ids = this.state.noteIds.filter(item => item != note.id)
        this.setState({noteIds: ids})
        delete gon.recipe.notes[note.id]
      }})
    }

    return (
      <Row key={id} gap="5px" marginBottom="5px">
        [{note.item_nb}]
        <Block flexGrow="1">
          <BubbleTiptap content={JSON.parse(note.json)} model="recipe_note" json_field="json" html_field="html" url={recipe_recipe_note_path(gon.recipe, note)} />
        </Block>
        <DeleteConfirmButton id={`note-${note.id}`} onDeleteConfirm={removeNote} message="Je veux enlever cette note?" />
      </Row>
    )
  })

  //const Tools = this.state.toolIds.map(id => (
  const Tools = [].map(id => (
    <li key={id}>
      {gon.recipe.tools[id].name}
    </li>
  ))

  const createMix = () => {
    ajax({url: mixes_path(), type: 'POST', data: {mix: {recipe_id: recipe.id}}, success: (mix) => {
      mixes.update([...mixes, mix])
    }})
  }

  let mixEditor = mix ? <EditMix {...{page, userRecipes, favoriteRecipes, machines, mixes, machineFoods, recipes}} /> : (<>
    <p>Vous pouvez ajouter des instructions pour automatiser cette recette.</p>
    <button type="button" className="btn btn-primary" onClick={createMix}>Ajouter</button>
  </>)

  let changeOwner = (e) => {
    let data = {recipeId: recipe.id, newOwnerId: e.target.id}
    ajax({url: '/change_recipe_owner', type: 'PATCH', data, success: () => {
      let old = window.hcu.getters['recipes']
      let updated = [...old].map(r => r.id == recipe.id ? {...r, user_id: e.target.id} : r)
      window.hcu.setters['recipes'](updated)
    }, error: (errors) => {
      console.log('ERROR AJAX UPDATING...', errors.responseText)
    }})
  }

  return (<>
    <div className="recipe">
      <div className="d-block d-md-flex gap-20">
        <div>
          <div className="over-container">
            <EditRecipeImageModal recipe={recipe} show={showImageModal}
                                  handleClose={() => setShowImageModal(false)}
                                  recipeImage={recipe_image} recipeKindImage={recipeKindImage} />
            <div style={{cursor: "pointer"}} onClick={() => setShowImageModal(false)}>
              <img style={{maxWidth: "100vh", height: "auto"}} src={imagePath} width="452" height="304"/>
              <div className="bottom-right" style={{color: 'white', fontSize: '2em'}}>
                <img src="/icons/pencil-circle.svg" style={{width: "5rem", padding: "0.5rem"}}/>
              </div>
            </div>
          </div> 
        </div>
        <div style={{width: '100%'}}>
          <h1>
            <span className="recipe-title">
              <TextField model={recipe} field="name" className="plain-input" />
            </span>
          </h1>
          <div style={{marginTop: '-1.2em', marginBottom: '1.2em', color: 'gray'}}>
            <div className="dropdown dropdown-toggle clickable" style={{padding: "0 1em"}}>
              <span data-bs-toggle="dropdown">par user{recipe.user_id}</span>
              <div className="dropdown-menu">
                {users.filter(u => u.id != recipe.user_id).map(usr => {
                  return <a key={usr.id} id={usr.id} className="dropdown-item clickable" onClick={changeOwner}>{usr.name}</a>
                })}
              </div>
            </div>
          </div>
          <div>
            <b>Préparation (minutes): </b>
            <span style={{color: 'gray'}}>
              <TextField model={recipe} field="preparation_time" className="editable-input" />
            </span>
          </div>
          <div>
            <b>Cuisson (minutes): </b>
            <span style={{color: 'gray'}}>
              <TextField model={recipe} field="cooking_time" className="editable-input" />
            </span>
          </div>
          <div>
            <b>Total (minutes): </b>
            <span style={{color: 'gray'}}>
              <TextField model={recipe} field="total_time" className="editable-input" />
            </span>
          </div>
          <div>
            <b>Portions: </b>
            <span style={{color: 'gray'}}>
              <TextField model={recipe} field="raw_servings" className="editable-input" />
            </span>
          </div>
        </div>
      </div>
      <div className="recipe-body">
        
        <h2>Commandes</h2>
        {mixEditor}

        <div style={{display: 'flex', alignItems: 'baseline'}}>
          <h2 style={{flexGrow: '1'}}>Ingrédients</h2>
          <div className="dropstart" style={{padding: "0 1em"}}>
            <img data-bs-toggle="dropdown" style={{cursor: "pointer"}} src="/icons/list.svg"/>
            <div className="dropdown-menu">
              <button className="dropdown-item" type="button" onClick={appendIngredientSection}>
                Ajouter une section
              </button>
            </div>
          </div>
        </div>
        {IngredientList}
      
        <h2>Instructions</h2>
        <Tiptap model={recipe} json_field="json" html_field="html" url={recipe_path(gon.recipe)} content={gon.recipe.json ? JSON.parse(gon.recipe.json) : null} editable={true} ingredients={ingredients} />
        {editable ? <InstructionsShortcuts/> : ''}
        
        <h3>Notes</h3>
        {NoteList}
        <button type="button" className="plain-btn" onClick={() => appendNote()}>
          <img src="/icons/plus-circle.svg" style={{width: "2.5rem", padding: "0.5rem"}}/>
        </button>
        
        <h2>Outils</h2>
        <ul style={{fontSize: "1.1rem"}}>
          {Tools}
        </ul>
        
        <h2>Informations</h2>
        <table className="table table-light">
          <tbody>
            <tr>
              <th>Ingrédient principal</th>
              <td><CollectionSelect model={recipe} field="main_ingredient_id" options={ingredients.map(i => i.id)} showOption={(ingId) => ingredients.filter(i => i.id == ingId).name} includeBlank="true"></CollectionSelect></td>
            </tr>
          </tbody>
        </table>

        <h2>Références</h2>

      </div>
    </div>
  </>)
}

