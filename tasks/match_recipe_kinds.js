// node -r dotenv/config tasks/match_recipe_kinds.js

import db from '../src/db.js';
import utils from '../src/utils.js';
import { normalizeSearchText } from "../src/react/utils.js"
import { findRecipeKindForRecipe } from "../src/lib.js"

import {fetchTable, RECIPE_ATTRS} from '../src/gon.js';

//db.run('ALTER TABLE recipes ADD COLUMN ingredients TEXT', [], function(err) {
//  if (err) {console.log('ERR', err)}
//})
  
fetchTable('recipe_kinds', {}, ['name', 'description_json', 'image_id'], () => {}, (recipe_kinds) => {

  fetchTable('recipes', {recipe_kind_id: null}, RECIPE_ATTRS, () => {}, (recipes) => {

    recipes.forEach(recipe => {

      let recipe_kind = findRecipeKindForRecipeName(recipe.name)

      if (recipe_kind) {
        db.run('UPDATE recipes SET recipe_kind_id = ? WHERE id = ?', [recipe_kind.id, recipe.id], function(err) {
          if (err) {console.log('ERR', err)}
          console.log('Found a recipe kind for recipe ' + recipe.id + ': ' + recipe.name + '('+recipe_kind.id+')')
        })
      }
    })
  })
})
