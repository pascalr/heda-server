// node -r dotenv/config migrations/recipe_images.js

import db from '../src/db.js';
import utils from '../src/utils.js';

import {fetchTable, RECIPE_ATTRS} from '../src/gon.js';

//db.run('ALTER TABLE recipes ADD COLUMN ingredients TEXT', [], function(err) {
//  if (err) {console.log('ERR', err)}
//})

const images = fetchTable('images', {}, ['filename'])
const recipeKinds = fetchTable('recipe_kinds', {}, ['image_id', 'image_slug'])

recipeKinds.forEach(recipeKind => {
  if (!recipeKind.image_slug && recipeKind.image_id) {
    let image = images.find(i => i.id == recipeKind.image_id)
    let ext = image.filename.substr(image.filename.lastIndexOf('.') + 1);
    let slug = `${image.id}.${ext}`
    db.updateField('recipe_kinds', recipeKind.id, 'image_slug', slug)
  }
})
