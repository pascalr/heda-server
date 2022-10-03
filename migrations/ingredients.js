// node -r dotenv/config migrations/ingredients.js

import db from '../src/db.js';
import utils from '../src/utils.js';

import {fetchTable, RECIPE_ATTRS} from '../src/gon.js';

db.run('ALTER TABLE recipes ADD COLUMN ingredients TEXT', [], function(err) {
  if (err) {console.log('ERR', err)}
})

fetchTable('recipes', {}, RECIPE_ATTRS, () => {}, (recipes) => {
 
  recipes.forEach(recipe => {

    let attrs = ['item_nb', 'raw', 'comment_html', 'raw_food']
    fetchTable('recipe_ingredients', {recipe_id: recipe.id}, attrs, () => {}, (records) => {

      let text = ''
      let ings = utils.sortBy(records, 'item_nb')
      ings.forEach(ing => {
        text += ing.raw + '; ' + ing.raw_food
        if (ing.comment_html) {
          text += ' ' + ing.comment_html
        }
        text += '\n'
      })
      db.run('UPDATE recipes SET ingredients = ? WHERE id = ?', [text, recipe.id], function(err) {
        if (err) {console.log('ERR', err)}
      })
    })
  })
})
