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

  let strat = new TranslationsCacheStrategy(translations, from, to)
  let translator = new Translator(new LogStrategy("About to translate:"), strat, new LogStrategy("MISSING TRANSLATION:"))

  console.log('*** RECIPE '+recipe.id+' ***')
  let translated = await translator.translateRecipe(recipe)

  if (translatedRecipes.find(r => r.original_id == recipe.id)) {
    console.log('*** SKIPING INSERT RECORD '+recipe.id+' ALREADY TRANSLATED ***')
    return
  }

  db.createRecord('translated_recipes', translated, {allow_write: ['original_id', 'name', 'servings_name', 'ingredients', 'json']})
  
})

//console.log('Missing count:', missing.length)
//let uniq = [...new Set(missing)]
//console.log('Unique missing count:', uniq.length)
//console.log('Char count:', uniq.reduce(function (sum, str) {
//  return sum + str.length
//}, 0))

