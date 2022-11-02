// node -r dotenv/config tasks/translate_recipes.js

import db from '../src/db.js';
import { parseIngredientsAndHeaders, serializeIngredientsAndHeaders } from '../src/lib.js';
import Translator from '../src/translator.js';

// TODO: Don't hardcode this. Check what language the source is.
let from = 1 // French
let to = 4 // English
let fromLocale = 'fr' // French
let toLocale = 'en' // French

const translations = db.fetchTable('translations', {}, ['from', 'to', 'original', 'translated'])
const frenchToEnglish = {}

translations.forEach(translation => {
  if (translation.from == from && translation.to == to) {
    frenchToEnglish[translation.original] = translation.translated
  } else if (translation.to == from && translation.from == to) {
    frenchToEnglish[translation.translated] = translation.original
  }
})

let attrs = ['name', 'json', 'servings_name', 'ingredients']
const recipes = db.fetchTable('recipes', {}, attrs)
//const recipes = db.fetchTable('recipes', {}, attrs, {limit: 10})
const translatedRecipes = db.fetchTable('translated_recipes', {}, ['original_id'])

// TODO: translate recipes by languages. If the recipe is english, translate from english to french...
recipes.forEach(async recipe => {

  let translator = new Translator(frenchToEnglish, normalized => {
    console.log('TRANSLATOR CALLED FOR:', normalized)
    //googleTranslate(normalized)
  })

  console.log('*** RECIPE '+recipe.id+' ***')
  let translated = {original_id: recipe.id}
  translated.name = await translator.translate(recipe.name)
  translated.servings_name = await translator.translate(recipe.servings_name)
 
  if (recipe.json) {
    translated.json = JSON.stringify(await translator.translateTiptapContent(JSON.parse(recipe.json)))
  }

  let ingredientsAndHeaders = parseIngredientsAndHeaders(recipe.ingredients)
  let translatedIngAndHeaders = await Promise.all(ingredientsAndHeaders.map(async ingOrHeader => {
    let r = {...ingOrHeader}
    if (r.header) { // Header
      r.header = await translator.translate(r.header)
    } else { // Ingredient
      // TODO: Translate quantity label. Ex: c. à table => tbsp, douzaine => dozen
      r.label = await translator.translate(r.label)
    }
    return r
  }))
  translated.ingredients = serializeIngredientsAndHeaders(translatedIngAndHeaders)

  // TODO: Translate ingredients

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

