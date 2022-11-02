import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import { ajax } from "./utils"
import { DeleteConfirmButton } from './components/delete_confirm_button'
import { RecipeTiptap, BubbleTiptap } from './tiptap'
import {AutocompleteInput, updateRecord, TextField, CollectionSelect, TextAreaField} from './form'
import { parseIngredientsAndHeaders, serializeIngredientsAndHeaders } from '../lib'
import {EditRecipeImageModal} from './modals/recipe_image'
import {PasteIngredientsButton} from './modals/paste_ingredients'
import { RecipeMediumImage } from "./image"
import { RecipeUtils } from "./recipe_utils"
import { t } from "../translate"

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

export const ShowMix = ({machineId, mixId, recipes, machines, mixes, machineFoods}) => {
  
  const context = {recipes, machines, mixes, machineFoods}

  const machine = machineId ? machines.find(m => m.id == machineId) : null
  const currentMachineFoods = machine ? machineFoods.filter(m => m.machine_id == machine.id) : machineFoods
  const mix = mixes.find(m => m.id == mixId)

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
      <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => changeUrl('/m/'+machine.id+'/e/'+mix.id)}>Modifier</button>
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

export const EditMix = ({machineId, mixId, recipes, recipeId, machines, mixes, machineFoods}) => {

  const context = {recipes, machines, mixes, machineFoods}

  const machine = machineId ? machines.find(m => m.id == machineId) : null
  const currentMachineFoods = machine ? machineFoods.filter(m => m.machine_id == machine.id) : machineFoods
  const mix = recipeId ? mixes.find(m => m.recipe_id == recipeId) : mixes.find(m => m.id == mixId)
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

  //const recipeIds = favoriteRecipes.map(r => r.recipe_id).concat(recipes.map(r => r.id))
  //const recipeNames = {}
  //favoriteRecipes.forEach(r => {recipeNames[r.recipe_id] = r.name})
  //recipes.forEach(r => {recipeNames[r.id] = r.name})
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

const NewIngredient = ({foods, updateIngredients, addIngredient}) => {
  
  const [qty, setQty] = useState('')
  const [label, setLabel] = useState('')

  const qtyInputField = useRef(null);

  function handleSubmit(e) {
    e.preventDefault()
    addIngredient(qty, label)
    setQty('')
    setLabel('')
    qtyInputField.current.focus()
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" className="editable-input" value={qty||''} name="qty" onChange={(e) => setQty(e.target.value)} ref={qtyInputField} style={{width: "8em", maxWidth: "15vw"}} />
      <div className="d-inline-block mx-2" style={{width: '1em'}}>de</div>
      <input type="text" value={label||''} name="label" style={{maxWidth: '32vw'}} onChange={(e) => setLabel(e.target.value)} />
      <button type="submit" className="btn btn-sm btn-primary ms-2">Ajouter</button>
    </form>
  )
}

const EditableIngredient = ({recipe, ingredient, itemNb, foods, mixes, updateIngredients, removeIngredientOrHeader}) => {
  
  const [qty, setQty] = useState(ingredient.qty)
  const [label, setLabel] = useState(ingredient.label)

  let mix = mixes.find(e => e.recipe_id == recipe.id)

  let moveIngToMix = () => {
    //let ins = mix.instructions+';ADD,'+ingredient.raw+','+(f ? f.name : ingredient.name)
    //ajax({url: mix_path(mix), type: 'PATCH', data: {mix: {instructions: ins}}, success: (mix) => {
    //  mixes.update(mixes.map(e => e.id == mix.id ? mix : e))
    //  removeIngredient()
    //}})
  }

  let preposition = RecipeUtils.needsPreposition(qty) ? RecipeUtils.prettyPreposition(label) : ''
  return (
    <div>
      <div className="float-end">
        {mix ? <img className="clickable" style={{marginRight: '0.4em'}} src="/icons/arrow-down-up.svg" width="16" height="16" onClick={moveIngToMix}></img> : '' }
        <DeleteConfirmButton id={`ing-${ingredient.key}`} onDeleteConfirm={() => removeIngredientOrHeader(itemNb-1)} message="Je veux enlever cet ingrédient?" />
      </div>
      <span style={{padding: "0 10px 0 0"}}><b>{itemNb}.</b></span>
      <input type="text" className="editable-input" value={qty||''} name="qty" onChange={(e) => setQty(e.target.value)} onBlur={(e) => {ingredient.qty = qty; updateIngredients()}} style={{width: "8em", maxWidth: "15vw"}} />
      <div className="d-inline-block mx-2" style={{width: '1em'}}>{preposition}</div>
      <input className="food-name" type="text" value={label||''} name="label" onChange={(e) => setLabel(e.target.value)} onBlur={(e) => {ingredient.label = label; updateIngredients()}} style={{border: '1px solid #ccc', maxWidth: '40vw'}} />
    </div>
  )
}

const EditableIngredientSection = ({item, index, updateIngredients, removeIngredientOrHeader}) => {

  const [header, setHeader] = useState(item.header)
                
  return <h3 style={{margin: "0", padding: "0.5em 0 0.2em 0"}}>
    <input type="text" size="24" className="plain-input" value={header||''} name="header" onChange={(e) => setHeader(e.target.value)} onBlur={(e) => {item.header = header; updateIngredients()}} />
    <span style={{margin: "0 0.2em"}}>
      <DeleteConfirmButton id={`del-${index}`} onDeleteConfirm={() => removeIngredientOrHeader(index)} message="Je veux enlever ce titre?" />
    </span>
  </h3>
}

export const RecipeEditor = ({recipe, machines, mixes, machineFoods, foods, recipeKinds, images, editable, user}) => {

  const [showImageModal, setShowImageModal] = useState(false)

  const [orderedIngredients, setOrderedIngredients] = useState(recipe.ingredients)
  useEffect(() => {
    setOrderedIngredients(recipe.ingredients)
  }, [recipe])

  if (!recipe || recipe.user_id != user.id) {return '';}

  const ingredientsAndHeaders = parseIngredientsAndHeaders(orderedIngredients)
  const ingredients = ingredientsAndHeaders.filter(e => e.label != null || e.qty != null)
  const mix = mixes.find(m => m.recipe_id == recipe.id)

  function handleDrop(droppedItem) {
  
    // Ignore drop outside droppable container
    if (!droppedItem.destination) return;
  
    let source = droppedItem.source.index
    let destination = droppedItem.destination.index
    console.log("source", source)
    console.log("destination", destination)
  
    var updatedList = [...ingredientsAndHeaders];
    const [reorderedItem] = updatedList.splice(source, 1);
    updatedList.splice(destination, 0, reorderedItem);
    let ings = serializeIngredientsAndHeaders(updatedList)
    window.hcu.updateField(recipe, 'ingredients', ings)
    setOrderedIngredients(ings)
  }

  function updateIngredients() {
    window.hcu.updateField(recipe, 'ingredients', serializeIngredientsAndHeaders(ingredientsAndHeaders))
  }

  function removeIngredientOrHeader(index) {
    ingredientsAndHeaders.splice(index, 1)
    window.hcu.updateField(recipe, 'ingredients', serializeIngredientsAndHeaders(ingredientsAndHeaders))
  }

  function addIngredient(qty, label) {
    let key = `${ingredientsAndHeaders.length}-${qty}; ${label}`
    ingredientsAndHeaders.push({key, qty, label})
    window.hcu.updateField(recipe, 'ingredients', serializeIngredientsAndHeaders(ingredientsAndHeaders))
  }

  function addIngredientSection() {
    ingredientsAndHeaders.push({key: `${ingredientsAndHeaders.length}-`, header: ''})
    window.hcu.updateField(recipe, 'ingredients', serializeIngredientsAndHeaders(ingredientsAndHeaders))
  }

  let itemNb = 0
  const renderedIngItems = ingredientsAndHeaders.map((ingOrHeader, i) => {
    return <Draggable key={ingOrHeader.key} draggableId={'drag-'+i} index={i}>
      {(provided) => (
        <div className="item-container" ref={provided.innerRef} {...provided.dragHandleProps} {...provided.draggableProps}>
          {function() {
            if (ingOrHeader.qty != null || ingOrHeader.label != null) {
              const ing = ingOrHeader
              itemNb += 1
              return <li className="list-group-item">
                {<EditableIngredient ingredient={ingOrHeader} {...{recipe, itemNb, mixes, foods, updateIngredients, removeIngredientOrHeader}} />}
              </li>
            } else {
              return <EditableIngredientSection item={ingOrHeader} index={i} {...{updateIngredients, removeIngredientOrHeader}} />
            }
          }()}
        </div>
      )}
    </Draggable>
  })

  const IngredientList = 
    <ul className="list-group" style={{maxWidth: "800px"}}>
      <DragDropContext onDragEnd={handleDrop}>
        <Droppable droppableId="list-container">
          {(provided) => (
            <div className="list-container" {...provided.droppableProps} ref={provided.innerRef}>
              {renderedIngItems}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <li className="list-group-item">
        <NewIngredient {...{foods, updateIngredients, addIngredient}} />
      </li>
    </ul>

  //const NoteList = this.state.noteIds.map(id => {
  //const NoteList = [].map(id => {
  //  const note = recipe.notes[id]

  //  const removeNote = (evt) => {
  //    ajax({url: recipe_recipe_note_path(recipe, note), type: 'DELETE', success: () => {
  //      let ids = this.state.noteIds.filter(item => item != note.id)
  //      this.setState({noteIds: ids})
  //      delete recipe.notes[note.id]
  //    }})
  //  }

  //  return (
  //    <Row key={id} gap="5px" marginBottom="5px">
  //      [{note.item_nb}]
  //      <Block flexGrow="1">
  //        <BubbleTiptap content={JSON.parse(note.json)} model="recipe_note" json_field="json" html_field="html" url={recipe_recipe_note_path(recipe, note)} />
  //      </Block>
  //      <DeleteConfirmButton id={`note-${note.id}`} onDeleteConfirm={removeNote} message="Je veux enlever cette note?" />
  //    </Row>
  //  )
  //})

  //const Tools = this.state.toolIds.map(id => (
  //const Tools = [].map(id => (
  //  <li key={id}>
  //    {recipe.tools[id].name}
  //  </li>
  //))

  //const createMix = () => {
  //  ajax({url: mixes_path(), type: 'POST', data: {mix: {recipe_id: recipe.id}}, success: (mix) => {
  //    mixes.update([...mixes, mix])
  //  }})
  //}
  //let mixEditor = mix ? <EditMix {...{favoriteRecipes, machines, mixes, machineFoods, recipes}} /> : (<>
  //  <p>Vous pouvez ajouter des instructions pour automatiser cette recette.</p>
  //  <button type="button" className="btn btn-primary" onClick={createMix}>Ajouter</button>
  //</>)
  let mixEditor = mix ? <>
    <h2>{t('Commands')}</h2>
    <EditMix {...{machines, mixes, machineFoods, recipes}} />
  </> : null

  let changeOwner = (e) => {
    let data = {recipeId: recipe.id, newOwnerId: e.target.id}
    ajax({url: '/change_recipe_owner', type: 'PATCH', data, success: () => {
      window.hcu.changeField(recipe, 'user_id', e.target.id)
    }, error: (errors) => {
      console.log('ERROR AJAX UPDATING...', errors.responseText)
    }})
  }
        
  //<h3>Notes</h3>
  //{NoteList}
  //<button type="button" className="plain-btn" onClick={() => appendNote()}>
  //  <img src="/icons/plus-circle.svg" style={{width: "2.5rem", padding: "0.5rem"}}/>
  //</button>
  //
  //<h2>Outils</h2>
  //<ul style={{fontSize: "1.1rem"}}>
  //  {Tools}
  //</ul>
  //
  //<h2>Informations</h2>
  //<table className="table table-light">
  //  <tbody>
  //    <tr>
  //      <th>Ingrédient principal</th>
  //      <td><CollectionSelect model={recipe} field="main_ingredient_id" options={ingredients.map(i => i.id)} showOption={(ingId) => ingredients.filter(i => i.id == ingId).name} includeBlank="true"></CollectionSelect></td>
  //    </tr>
  //  </tbody>
  //</table>
  //<h2>Références</h2>
          
  //const recipeUser = users.find(u => u.id == recipe.user_id)
  //const userName = recipeUser ? recipeUser.name : `user${recipe.user_id}`
  //<div style={{marginTop: '-0.8em', marginBottom: '1.2em', color: 'gray'}}>
  //  <div className="dropdown dropdown-toggle clickable" style={{padding: "0 1em"}}>
  //    <span data-bs-toggle="dropdown">par {userName}</span>
  //    <div className="dropdown-menu">
  //      {users.filter(u => u.id != recipe.user_id).map(usr => {
  //        return <a key={usr.id} id={usr.id} className="dropdown-item clickable" onClick={changeOwner}>{usr.name}</a>
  //      })}
  //    </div>
  //  </div>
  //</div>

  return (<>
    <div className="recipe">
      <div className="d-block d-md-flex">
        <div>
          <div className="over-container">
            <EditRecipeImageModal {...{recipe, recipeKinds, images}} show={showImageModal}
                                   handleClose={() => setShowImageModal(false)} />
            <div style={{cursor: "pointer"}} onClick={() => setShowImageModal(true)}>
              <RecipeMediumImage {...{recipe, recipeKinds, images}} />
              <div className="bottom-right" style={{color: 'white', fontSize: '2em'}}>
                <img src="/icons/pencil-circle.svg" style={{width: "5rem", padding: "0.5rem"}}/>
              </div>
            </div>
          </div> 
        </div>
        <div style={{height: '20px', minWidth: '20px'}}></div>
        <div style={{width: '100%'}}>
          <h1>
            <span className="recipe-title">
              <TextAreaField model={recipe} style={{width: '100%', lineHeight: '1em'}} field="name" className="plain-input" />
            </span>
          </h1>
          <div>
            <b>{t('Preparation')} ({t('min')}): </b>
            <span style={{color: 'gray'}}>
              <TextField model={recipe} field="preparation_time" className="editable-input" size="8"/>
            </span>
          </div>
          <div>
            <b>{t('Cooking')} ({t('min')}): </b>
            <span style={{color: 'gray'}}>
              <TextField model={recipe} field="cooking_time" className="editable-input" size="8" />
            </span>
          </div>
          <div>
            <b>{t('Total')} ({t('min')}): </b>
            <span style={{color: 'gray'}}>
              <TextField model={recipe} field="total_time" className="editable-input" size="8" />
            </span>
          </div>
          <div>
            <b>{t('Servings')}: </b>
            <span style={{color: 'gray'}}>
              <TextField model={recipe} field="raw_servings" className="editable-input" />
            </span>
          </div>
        </div>
      </div>
      <div className="recipe-body">
        {mixEditor}
        <div style={{display: 'flex', alignItems: 'baseline'}}>
          <h2 style={{flexGrow: '1'}}>{t('Ingredients')}</h2>
          <div className="dropstart" style={{padding: "0 1em"}}>
            <img data-bs-toggle="dropdown" style={{cursor: "pointer"}} src="/icons/list.svg"/>
            <div className="dropdown-menu">
              <button className="dropdown-item" type="button" onClick={addIngredientSection}>
                {t('Add_section')}
              </button>
            </div>
          </div>
        </div>
        {IngredientList}
        <PasteIngredientsButton recipe={recipe} />
      
        <h2>{t('Instructions')}</h2>
        <RecipeTiptap recipe={recipe} editable={true} ingredients={ingredients} />
      </div>
    </div>
  </>)
}

