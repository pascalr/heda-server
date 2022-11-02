// node -r dotenv/config tasks/translate_recipes.js

import db from '../src/db.js';
//import utils from '../src/utils.js';
//import { normalizeSearchText } from "../src/react/utils.js"
//import { findRecipeKindForRecipe } from "../src/lib.js"
//

//db.run('ALTER TABLE recipes ADD COLUMN ingredients TEXT', [], function(err) {
//  if (err) {console.log('ERR', err)}
//})

let attrs = ['name', 'json', 'servings_name']
const recipes = db.fetchTable('recipes', {}, attrs)

recipes.forEach(recipe => {

  let translated = {original_id: recipe.id}
  translated.name = translate(recipe.name)
  translated.servings_name = translate(recipe.servings_name)

  db.createRecord('translated_recipes', translated)
  
})
