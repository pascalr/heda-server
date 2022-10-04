// node -r dotenv/config migrations/ingredients.js

import db from '../src/db.js';
import utils from '../src/utils.js';

import {fetchTable, RECIPE_ATTRS} from '../src/gon.js';

//db.run('ALTER TABLE recipes ADD COLUMN ingredients TEXT', [], function(err) {
//  if (err) {console.log('ERR', err)}
//})

fetchTable('recipes', {}, RECIPE_ATTRS, () => {}, (recipes) => {
 
  let attrs = ['before_ing_nb', 'name', 'recipe_id']
  fetchTable('ingredient_sections', {}, attrs, () => {}, (ingredient_sections) => {

    recipes.forEach(recipe => {

      let attrs = ['item_nb', 'raw', 'comment_html', 'raw_food']
      fetchTable('recipe_ingredients', {recipe_id: recipe.id}, attrs, () => {}, (records) => {

        let text = ''
        let ings = utils.sortBy(records, 'item_nb')
        ings.forEach(ing => {
          let beforeNb = ing.item_nb == 1 ? null : ing.item_nb
          let sections = ingredient_sections.filter(s => s.recipe_id == recipe.id && s.before_ing_nb == beforeNb)
          sections.forEach(section => {
            text += '# ' + section.name+ '\n'
          })
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
})
