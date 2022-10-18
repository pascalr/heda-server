// node -r dotenv/config migrations/recipe_images.js

import db from '../src/db.js';

import {RECIPE_ATTRS} from '../src/gon.js';

//db.run('ALTER TABLE recipes ADD COLUMN ingredients TEXT', [], function(err) {
//  if (err) {console.log('ERR', err)}
//})

const images = db.fetchTable('images', {}, ['filename'])
const recipes = db.fetchTable('recipes', {}, RECIPE_ATTRS)
const recipeKinds = db.fetchTable('recipe_kinds', {}, ['image_id', 'image_slug'])

recipes.forEach(recipe => {
  if (!recipe.image_slug && recipe.recipe_kind_id) {
    let recipeKind = recipeKinds.find(k => k.id == recipe.recipe_kind_id)
    db.safeUpdateField('recipes', recipe.id, 'image_slug', recipeKind.image_slug, {user_id: recipe.user_id})
  }
})
