import db from './db.js';
import utils from './utils.js';

//class AppController < ApplicationController
//  def index
//    gon.current_user_admin = current_user_admin?
//    gon.containers = current_user.containers.map {|c| c.to_obj}
//    gon.machine_foods = current_user.machine_foods.includes(:food).sort_by(&:name).map {|f| f.to_obj}
//    gon.container_quantities = current_user.container_quantities.includes(:container_format).map {|c| c.to_obj}
//    gon.ingredient_sections = IngredientSection.where(recipe_id: gon.recipes.map{|e|e[:id]}).map {|e| e.to_obj}
//    gon.images = Image.where(id: gon.recipes.map{|e|e[:image_id]}+gon.recipe_kinds.map{|e|e[:image_id]}).map {|e| e.to_obj }
//    gon.contractionList = FrenchExpression.where(contract_preposition: true).map(&:singular)
//  end
//end

function mapClassName(objs, tableName) {
  // TODO: Handle exceptions like mixes
  let className = tableName.substr(0, tableName.length-1)
  return objs.map(o => {o.class_name = className; return o;})
}

function fetchTable(tableName, conditions, attributes, next, callback) {
  let s = 'SELECT '+['id',...attributes].join(', ')+' FROM '+tableName
  let a = []
  let l = Object.keys(conditions).length
  if (l != 0) {s += ' WHERE '}
  Object.keys(conditions).forEach((cond,i) => {
    if (i < l-1) {s += ' AND '}
    let val = conditions[cond]
    if (val == null) {
      s += cond + ' IS NULL'
    } else if (Array.isArray(val) && val.length > 1) {
      s += cond + ' IN ('
      val.forEach((v,i) => {
        s += '?' + ((i < val.length - 1) ? ', ' : '')
        a.push(v)
      })
      s += ')'
    } else {
      s += cond + ' = ?'
      a.push(val)
    }
  })
  console.log('statement:', s)
  console.log('values', a)
  db.all(s, a, function(err, rows) {
    if (err) { return next(err); }
    callback(mapClassName(rows, tableName))
    next();
  })
}


function fetchUsers(req, res, next) {
  fetchTable('users', {account_id: req.user.account_id}, ['name'], next, (records) => {
    res.locals.users = records
  })
}


const RECIPE_ATTRS = ['name', 'recipe_kind_id', 'main_ingredient_id', 'preparation_time', 'cooking_time', 'total_time', 'json', 'use_personalised_image', 'image_id']
function fetchRecipes(req, res, next) {
  fetchTable('recipes', {user_id: req.user.user_id}, RECIPE_ATTRS, next, (records) => {
    res.locals.gon.recipes = utils.sortBy(records, 'name')
  })
}

function fetchRecipeIngredients(req, res, next) {
  let attrs = ['item_nb', 'raw', 'comment_json', 'food_id', 'raw_food', 'recipe_id']
  let ids = res.locals.gon.recipes.map(r=>r.id)
  fetchTable('recipe_ingredients', {recipe_id: ids}, attrs, next, (records) => {
    res.locals.gon.recipe_ingredients = utils.sortBy(records, 'item_nb').map(r => {
      r.name = r.raw_food||''; return r;
    })
  })
}

function fetchRecipeKinds(req, res, next) {
  fetchTable('recipe_kinds', {}, ['name', 'description_json', 'image_id'], next, (records) => {
    res.locals.gon.recipe_kinds = utils.sortBy(records, 'name')
  })
}

function fetchMixes(req, res, next) {
  let attrs = ['name', 'instructions', 'recipe_id', 'original_recipe_id']
  fetchTable('mixes', {user_id: req.user.user_id}, attrs, next, (records) => {
    res.locals.gon.mixes = utils.sortBy(records, 'name')
  })
}

function fetchUserTags(req, res, next) {
  let attrs = ['tag_id', 'position']
  fetchTable('user_tags', {user_id: req.user.user_id}, attrs, next, (records) => {
    res.locals.gon.user_tags = utils.sortBy(records, 'position')
  })
}

function fetchMachines(req, res, next) {
  // FIXME: Condition based on MachineUser model...
  fetchTable('machines', {}, ['name'], next, (records) => {
    res.locals.gon.machines = records
  })
}

function fetchFavoriteRecipes(req, res, next) {

  // , 'image_used_id'
  fetchTable('favorite_recipes', {}, ['list_id', 'recipe_id'], next, (records) => {
    res.locals.gon.favorite_recipes = utils.sortBy(records, 'name')
  })
}
 
function fetchFavoriteRecipesRecipe(req, res, next) {
  let recipe_ids = res.locals.gon.favorite_recipes.map(r=>r.recipe_id)
  fetchTable('recipes', {id: recipe_ids}, RECIPE_ATTRS, next, (records) => {
    res.locals.gon.recipes = utils.removeDuplicateIds(res.locals.gon.recipes.concat(utils.sortBy(records, 'name')))
  })
}

//function fetchFavoriteRecipesNames(req, res, next) {
//  let ids = res.locals.gon.favorite_recipes.map(r=>r.recipe_id)
//  fetchTable('recipes', {id: ids}, ['name'], next, (recipes) => {
//    res.locals.gon.favorite_recipes = res.locals.gon.favorite_recipes.map(f => {
//      let r = recipes.find(r => r.id == f.recipe_id)
//      if (r) {
//        f.name = r.name
//      } else {
//        console.log('WARNING: Missing recipe for favorite recipe')
//      }
//      return f
//    })
//  })
//}

//    gon.favorite_recipes = current_user.favorite_recipes.includes(:recipe).sort_by {|fav| fav.recipe.name}.map{|fav| fav.to_obj}

function fetchSuggestions(req, res, next) {
  let attrs = ['user_id', 'recipe_id', 'filter_id', 'score']
  fetchTable('suggestions', {user_id: req.user.user_id}, attrs, next, (records) => {
    res.locals.gon.suggestions = records
  })
}

function fetchUserRecipeFilters(req, res, next) {
  let attrs = ['name', 'image_src', 'user_id']
  fetchTable('recipe_filters', {user_id: req.user.user_id}, attrs, next, (records) => {
    res.locals.gon.recipe_filters = utils.removeDuplicateIds([...(res.locals.gon.recipe_filters||[]), ...records])
  })
}

function fetchPublicRecipeFilters(req, res, next) {
  let attrs = ['name', 'image_src', 'user_id']
  fetchTable('recipe_filters', {user_id: null}, attrs, next, (records) => {
    res.locals.gon.recipe_filters = utils.removeDuplicateIds([...(res.locals.gon.recipe_filters||[]), ...records])
  })
}

function fetchFoods(req, res, next) {
  fetchTable('foods', {}, ['name'], next, (records) => {
    res.locals.gon.foods = utils.sortBy(records, 'name')
  })
}

function fetchUnits(req, res, next) {
  let attrs = ['name', 'value', 'is_weight', 'is_volume', 'show_fraction']
  fetchTable('units', {}, attrs, next, (records) => {
    res.locals.gon.units = records
  })
}

function fetchNotes(req, res, next) {
  let ids = res.locals.gon.recipes.map(r=>r.id)
  fetchTable('recipe_notes', {recipe_id: ids}, ['item_nb'], next, (records) => {
    res.locals.gon.notes = records
  })
}

function fetchIngredientSections(req, res, next) {
  let ids = res.locals.gon.recipes.map(r=>r.id)
  let attrs = ['before_ing_nb', 'name', 'recipe_id']
  fetchTable('ingredient_sections', {recipe_id: ids}, attrs, next, (records) => {
    res.locals.gon.ingredient_sections = records
  })
}

function fetchImages(req, res, next) {
  let ids = res.locals.gon.recipes.map(r=>r.image_id).filter(x=>x)
  ids = [...ids, ...res.locals.gon.recipe_kinds.map(r=>r.image_id).filter(x=>x)]
  let attrs = ['author', 'source', 'filename', 'is_user_author']
  fetchTable('images', {id: ids}, attrs, next, (records) => {
    res.locals.gon.images = records
  })
}

function initGon(req, res, next) {
  res.locals.gon = {}; next()
}

// WARNING: LIST ORDER IS IMPORTANT
const fetchAll = [initGon, fetchUsers, fetchRecipes, fetchFavoriteRecipes, fetchFavoriteRecipesRecipe, fetchRecipeIngredients, fetchRecipeKinds, fetchMixes, fetchUserTags, fetchMachines, fetchSuggestions, fetchUserRecipeFilters, fetchPublicRecipeFilters, fetchFoods, fetchUnits, fetchNotes, fetchIngredientSections, fetchImages]

const gon = {fetchAll, fetchUsers};
export default gon;
//module.exports = gon;
