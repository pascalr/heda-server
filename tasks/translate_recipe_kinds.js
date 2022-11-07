// node -r dotenv/config tasks/translate_recipe_kinds.js

import db from '../src/db.js';
import Translator, { StoreStrategy, TranslationsCacheStrategy, LogStrategy } from '../src/translator.js';

// TODO: Don't hardcode this. Check what language the source is.
let from = 1 // French
let to = 4 // English
let fromLocale = 'fr' // French
let toLocale = 'en' // French

const translations = db.fetchTable('translations', {}, ['from', 'to', 'original', 'translated'])

let attrs = ['name_fr', 'name_en']
const recipeKinds = db.fetchTable('recipe_kinds', {}, attrs)

// TODO: translate recipes by languages. If the recipe is english, translate from english to french...
let logMissing = new LogStrategy("\x1b[0;91mMISSING TRANSLATION\x1b[0m:")
let cache = new TranslationsCacheStrategy(translations, from, to)

await Promise.all(recipeKinds.map(async recipeKind => {

  if (recipeKind.name_en) {
    console.log('Recipe recipe kind already has english name')
    return;
  }

  let translator = new Translator(cache, logMissing)

  console.log('*** RECIPE KIND '+recipeKind.id+' ***')
  let translated = await translator.translatePart(recipeKind.name_fr)

  if (translated) {
    console.log('*** UPDATING RECORD FOR',recipeKind.id,'***')
    db.safeUpdateField('recipe_kinds', recipeKind.id, 'name_en', translated, {is_admin: true})
  }
  
}))
