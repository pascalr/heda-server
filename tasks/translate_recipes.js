// node -r dotenv/config tasks/translate_recipes.js

import db from '../src/db.js';
import Translator, { TranslationsCacheStrategy, LogStrategy } from '../src/translator.js';

// TODO: Don't hardcode this. Check what language the source is.
let from = 1 // French
let to = 4 // English
let fromLocale = 'fr' // French
let toLocale = 'en' // French

export const translateRecipes = () => {

  const translations = db.fetchTable('translations', {}, ['from', 'to', 'original', 'translated'])
  
  let attrs = ['name', 'json', 'servings_name', 'ingredients']
  const recipes = db.fetchTable('recipes', {}, attrs)
  //const recipes = db.fetchTable('recipes', {}, attrs, {limit: 3})
  const translatedRecipes = db.fetchTable('translated_recipes', {}, ['original_id', 'name', 'servings_name', 'ingredients', 'json'])
  
  // TODO: translate recipes by languages. If the recipe is english, translate from english to french...
  recipes.forEach(async recipe => {
  
    let cache = new TranslationsCacheStrategy(translations, from, to)
    let translator = new Translator(cache, new LogStrategy("\x1b[0;91mMISSING TRANSLATION\x1b[0m:"))
  
    console.log('*** RECIPE '+recipe.id+' ***')
    let translated = await translator.translateRecipe(recipe)
  
    let translatedRecipe = translatedRecipes.find(r => r.original_id == recipe.id)
    if (translatedRecipe) {
      console.log('*** UPDATING RECORD FOR',recipe.id,'***')
      // TODO: UpdateRecord instead of UpdateField
      if (translatedRecipe.name != translated.name) {
        db.safeUpdateField('translated_recipes', translatedRecipe.id, 'name', translated.name, {original_id: recipe.id})
      }
      if (translatedRecipe.servings_name != translated.servings_name) {
        db.safeUpdateField('translated_recipes', translatedRecipe.id, 'servings_name', translated.servings_name, {original_id: recipe.id})
      }
      if (translatedRecipe.ingredients != translated.ingredients) {
        db.safeUpdateField('translated_recipes', translatedRecipe.id, 'ingredients', translated.ingredients, {original_id: recipe.id})
      }
      if (translatedRecipe.json != translated.json) {
        db.safeUpdateField('translated_recipes', translatedRecipe.id, 'json', translated.json, {original_id: recipe.id})
      }
    } else {
      console.log('*** INSERTING RECORD FOR',recipe.id,'***')
      db.safeCreateRecord('translated_recipes', translated, {original_id: recipe.id}, {allow_write: ['original_id', 'name', 'servings_name', 'ingredients', 'json']})
    }
    
  })
  
  //console.log('Missing count:', missing.length)
  //let uniq = [...new Set(missing)]
  //console.log('Unique missing count:', uniq.length)
  //console.log('Char count:', uniq.reduce(function (sum, str) {
  //  return sum + str.length
  //}, 0))
  
}
