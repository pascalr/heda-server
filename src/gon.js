import {db} from './db.js';
import utils from './utils.js';

export function fetchTableMiddleware(tableName, conditions, attributes, next, callback) {
  const rows = db.fetchTable(tableName, conditions, attributes)
  callback(rows)
  next()
}

function fetchAccountUsers(req, res, next) {
  fetchTableMiddleware('users', {account_id: req.user.account_id}, ['name', 'gender', 'image_slug', 'locale', 'is_public'], next, (records) => {
    res.locals.users = records
    if (res.locals.gon) {res.locals.gon.users = records}
  })
}

function mapBooleans(records, fields) {
  records.forEach(record => {
    fields.forEach(field => {
      record[field] = record[field] && record[field] != 'false'
    })
  })
  return records
}

export const RECIPE_ATTRS = ['user_id', 'name', 'recipe_kind_id', 'main_ingredient_id', 'preparation_time', 'cooking_time', 'total_time', 'json', 'use_personalised_image', 'ingredients', 'image_slug']


function fetchUserImages(req, res, next) {
  let attrs = ['author', 'source', 'filename', 'is_user_author']
  fetchTableMiddleware('images', {user_id: req.user.user_id}, attrs, next, (records) => {
    res.locals.gon.images = records
  })
}


export function initGon(req, res, next) {
  res.locals.gon = {}; next()
}

const fetchAll = (req, res, next) => {
  let user = req.user
  res.locals.gon = fetchAll3(req.user)
  next()
}

const fetchAll3 = (user) => {
  let o = {}
  let attrs = null
  let ids = null
  o.users = db.fetchTable('users', {account_id: user.account_id}, ['name', 'gender', 'image_slug', 'locale', 'is_public'])
  o.recipes = mapBooleans(db.fetchTable('recipes', {user_id: user.user_id}, RECIPE_ATTRS), ['use_personalised_image'])
  o.favorite_recipes = db.fetchTable('favorite_recipes', {user_id: user.user_id}, ['list_id', 'recipe_id'])
  let recipeIds = o.recipes.map(r => r.id)
  let missingRecipeIds = o.favorite_recipes.map(r=>r.recipe_id).filter(id => !recipeIds.includes(id))
  o.recipes = [...o.recipes, ...db.fetchTable('recipes', {id: missingRecipeIds}, RECIPE_ATTRS)]
  //o.recipe_kinds = db.fetchTable('recipe_kinds', {}, ['name', 'description_json', 'image_slug'])
  attrs = ['name', 'instructions', 'recipe_id', 'original_recipe_id']
  o.mixes = db.fetchTable('mixes', {user_id: user.user_id}, attrs)
  o.machine_users = db.fetchTable('machine_users', {user_id: user.user_id}, ['machine_id'])
  o.machines = db.fetchTable('machines', {id: o.machine_users.map(m=>m.id)}, ['name'])
  o.container_formats = db.fetchTable('container_formats', {}, ['name'])
  attrs = ['container_format_id', 'machine_food_id', 'full_qty_quarters']
  o.container_quantities = db.fetchTable('container_quantities', {}, attrs)
  ids = o.machines.map(m=>m.id)
  attrs = ['jar_id', 'machine_id', 'container_format_id', 'pos_x', 'pos_y', 'pos_z', 'food_id']
  o.containers = db.fetchTable('containers', {machine_id: ids}, attrs)
  attrs = ['user_id', 'recipe_id', 'tag_id', 'score']
  o.suggestions = db.fetchTable('suggestions', {user_id: user.user_id}, attrs)
  attrs = ['name', 'image_slug', 'user_id', 'position']
  o.tags = db.fetchTable('tags', {user_id: user.user_id}, attrs)
  o.foods = db.fetchTable('foods', {}, ['name'])
  attrs = ['name', 'value', 'is_weight', 'is_volume', 'show_fraction']
  o.units = db.fetchTable('units', {}, attrs)

  let slugs1 = o.recipes.map(r=>r.image_slug).filter(x=>x)
  //let slugs2 = o.recipe_kinds.map(r=>r.image_slug).filter(x=>x)
  let slugs3 = o.tags.map(t=>t.image_slug).filter(x=>x)
  ids = [...slugs1, ...slugs3].map(s => s.split('.')[0])
  attrs = ['author', 'source', 'filename', 'is_user_author']
  o.images = db.fetchTable('images', {id: ids}, attrs).map(im => {
    // FIXME
    let ext = im.filename.substr(im.filename.lastIndexOf('.') + 1);
    im.slug = `${im.id}.${ext}`
    return im
  })

  o.machine_foods = db.fetchTable('machine_foods', {}, ['food_id', 'machine_id'])
  ids = o.users.map(u => u.id).filter(id => id != user.user_id)
  o.friends_recipes = db.fetchTable('recipes', {user_id: ids}, ['name', 'user_id', 'image_slug', 'recipe_kind_id'])

  return o
}

const gon = {fetchAll, fetchAccountUsers, fetchUserImages};
export default gon;
//module.exports = gon;
