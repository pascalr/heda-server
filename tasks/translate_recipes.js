// node -r dotenv/config tasks/translate_recipes.js

import db from '../src/db.js';
import Translator, { TranslationsCacheStrategy, LogStrategy } from '../src/translator.js';

// TODO: Don't hardcode this. Check what language the source is.
let from = 1 // French
let to = 4 // English
let fromLocale = 'fr' // French
let toLocale = 'en' // French

const translations = db.fetchTable('translations', {}, ['from', 'to', 'original', 'translated'])

let attrs = ['name', 'json', 'servings_name', 'ingredients']
//const recipes = db.fetchTable('recipes', {}, attrs)
const recipes = db.fetchTable('recipes', {}, attrs, {limit: 3})
const translatedRecipes = db.fetchTable('translated_recipes', {}, ['original_id'])

// TODO: translate recipes by languages. If the recipe is english, translate from english to french...
recipes.forEach(async recipe => {

  let cache = new TranslationsCacheStrategy(translations, from, to)
  let translator = new Translator(new LogStrategy("About to translate:"), cache, new LogStrategy("MISSING TRANSLATION:"))

  console.log('*** RECIPE '+recipe.id+' ***')
  let translated = await translator.translateRecipe(recipe)

  let translatedRecipe = translatedRecipes.find(r => r.original_id == recipe.id)
  if (translatedRecipe) {
    console.log('*** UPDATING RECORD FOR',recipe.id,'***')
    // TODO: UpdateRecord instead of UpdateField
    db.safeUpdateField('translated_recipes', translatedRecipe.id, 'name', translatedRecipe.name, {user_id: recipe.user_id})
    db.safeUpdateField('translated_recipes', translatedRecipe.id, 'servings_name', translatedRecipe.servings_name, {user_id: recipe.user_id})
    db.safeUpdateField('translated_recipes', translatedRecipe.id, 'ingredients', translatedRecipe.ingredients, {user_id: recipe.user_id})
    db.safeUpdateField('translated_recipes', translatedRecipe.id, 'json', translatedRecipe.json, {user_id: recipe.user_id})
  } else {
    console.log('*** INSERTING RECORD FOR',recipe.id,'***')
    db.safeCreateRecord('translated_recipes', translated, {is_admin: true}, {allow_write: ['original_id', 'name', 'servings_name', 'ingredients', 'json']})
  }
  
})

//console.log('Missing count:', missing.length)
//let uniq = [...new Set(missing)]
//console.log('Unique missing count:', uniq.length)
//console.log('Char count:', uniq.reduce(function (sum, str) {
//  return sum + str.length
//}, 0))

