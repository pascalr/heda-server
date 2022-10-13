import db from './db.js';
import utils from './utils.js';

export function fetchTable(tableName, conditions, attributes, callback) {
  let s = 'SELECT '+['id',...attributes].join(', ')+' FROM '+tableName
  let a = []
  let l = Object.keys(conditions).length
  if (l != 0) {s += ' WHERE '}
  Object.keys(conditions).forEach((cond,i) => {
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
    if (i < l-1) {s += ' AND '}
  })
  console.log('statement:', s)
  console.log('values', a)
  db.all(s, a, function(err, rows) {
    if (err) { return callback(null, err); }

    let rowsWithTableName = rows.map(o => {o.table_name = tableName; return o;})
    callback(rowsWithTableName, null)
  })
}

function fetchTableMiddleware(tableName, conditions, attributes, next, callback) {
  fetchTable(tableName, conditions, attributes, (rows, err=null) => {
    if (err) { return next(err); }
    callback(rows)
    next()
  })
}

function fetchAccountUsers(req, res, next) {
  fetchTableMiddleware('users', {account_id: req.user.account_id}, ['name', 'gender', 'image_slug', 'locale'], next, (records) => {
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

export const RECIPE_ATTRS = ['user_id', 'name', 'recipe_kind_id', 'main_ingredient_id', 'preparation_time', 'cooking_time', 'total_time', 'json', 'use_personalised_image', 'image_id', 'ingredients']
function fetchRecipes(req, res, next) {
  fetchTableMiddleware('recipes', {user_id: req.user.user_id}, RECIPE_ATTRS, next, (records) => {
    res.locals.gon.recipes = mapBooleans(utils.sortBy(records, 'name'), ['use_personalised_image'])
  })
}

function fetchFriendsRecipes(req, res, next) {
  let ids = res.locals.gon.users.map(u => u.id).filter(id => id != req.user.user_id)
  fetchTableMiddleware('recipes', {user_id: ids}, ['name', 'user_id', 'image_id', 'recipe_kind_id'], next, (records) => {
    res.locals.gon.friends_recipes = utils.sortBy(records, 'name')
  })
}

//function fetchRecipeIngredients(req, res, next) {
//  let attrs = ['item_nb', 'raw', 'comment_json', 'food_id', 'raw_food', 'recipe_id']
//  let ids = res.locals.gon.recipes.map(r=>r.id)
//  fetchTableMiddleware('recipe_ingredients', {recipe_id: ids}, attrs, next, (records) => {
//    res.locals.gon.recipe_ingredients = utils.sortBy(records, 'item_nb').map(r => {
//      r.name = r.raw_food||''; return r;
//    })
//  })
//}

function fetchRecipeKinds(req, res, next) {
  fetchTableMiddleware('recipe_kinds', {}, ['name', 'description_json', 'image_id'], next, (records) => {
    res.locals.gon.recipe_kinds = utils.sortBy(records, 'name')
  })
}

function fetchMachineFoods(req, res, next) {
  fetchTableMiddleware('machine_foods', {}, ['food_id', 'machine_id'], next, (records) => {
    res.locals.gon.machine_foods = records
  })
}

function fetchMixes(req, res, next) {
  let attrs = ['name', 'instructions', 'recipe_id', 'original_recipe_id']
  fetchTableMiddleware('mixes', {user_id: req.user.user_id}, attrs, next, (records) => {
    res.locals.gon.mixes = utils.sortBy(records, 'name')
  })
}

//function fetchUserTags(req, res, next) {
//  let attrs = ['tag_id', 'position']
//  fetchTableMiddleware('user_tags', {user_id: req.user.user_id}, attrs, next, (records) => {
//    res.locals.gon.user_tags = utils.sortBy(records, 'position')
//  })
//}

function fetchMachineUsers(req, res, next) {
  fetchTableMiddleware('machine_users', {user_id: req.user.user_id}, ['machine_id'], next, (records) => {
    res.locals.machine_users = records
  })
}

function fetchMachines(req, res, next) {
  let ids = res.locals.machine_users.map(m=>m.id)
  fetchTableMiddleware('machines', {id: [ids]}, ['name'], next, (records) => {
    res.locals.gon.machines = records
  })
}

function fetchContainers(req, res, next) {
  let ids = res.locals.gon.machines.map(m=>m.id)
  let attrs = ['jar_id', 'machine_id', 'container_format_id', 'pos_x', 'pos_y', 'pos_z', 'food_id']
  fetchTableMiddleware('containers', {machine_id: [ids]}, attrs, next, (records) => {
    res.locals.gon.containers = records
  })
}

function fetchContainerFormats(req, res, next) {
  fetchTableMiddleware('container_formats', {}, ['name'], next, (records) => {
    res.locals.gon.container_formats = records
  })
}

function fetchContainerQuantities(req, res, next) {
  let attrs = ['container_format_id', 'machine_food_id', 'full_qty_quarters']
  fetchTableMiddleware('container_quantities', {}, attrs, next, (records) => {
    res.locals.gon.container_quantities = records
  })
}

function fetchFavoriteRecipes(req, res, next) {

  fetchTableMiddleware('favorite_recipes', {user_id: req.user.user_id}, ['list_id', 'recipe_id'], next, (records) => {
    res.locals.gon.favorite_recipes = utils.sortBy(records, 'name')
  })
}
 
function fetchFavoriteRecipesRecipe(req, res, next) {
  let recipe_ids = res.locals.gon.favorite_recipes.map(r=>r.recipe_id)
  fetchTableMiddleware('recipes', {id: recipe_ids}, RECIPE_ATTRS, next, (records) => {
    res.locals.gon.recipes = utils.removeDuplicateIds(res.locals.gon.recipes.concat(utils.sortBy(records, 'name')))
  })
}

//function fetchFavoriteRecipesNames(req, res, next) {
//  let ids = res.locals.gon.favorite_recipes.map(r=>r.recipe_id)
//  fetchTableMiddleware('recipes', {id: ids}, ['name'], next, (recipes) => {
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
  let attrs = ['user_id', 'recipe_id', 'tag_id', 'score']
  fetchTableMiddleware('suggestions', {user_id: req.user.user_id}, attrs, next, (records) => {
    res.locals.gon.suggestions = records.filter(r => r.tag_id) // FIXME: Fix the data. tag_id is mandatory...
  })
}

function fetchTags(req, res, next) {
  let attrs = ['name', 'image_slug', 'user_id']
  fetchTableMiddleware('tags', {user_id: req.user.user_id}, attrs, next, (records) => {
    res.locals.gon.tags = records
  })
}

//function fetchUserRecipeFilters(req, res, next) {
//  let attrs = ['name', 'image_src', 'user_id']
//  fetchTableMiddleware('recipe_filters', {user_id: req.user.user_id}, attrs, next, (records) => {
//    res.locals.gon.recipe_filters = utils.removeDuplicateIds([...(res.locals.gon.recipe_filters||[]), ...records])
//  })
//}
//
//function fetchPublicRecipeFilters(req, res, next) {
//  let attrs = ['name', 'image_src', 'user_id']
//  fetchTableMiddleware('recipe_filters', {user_id: null}, attrs, next, (records) => {
//    res.locals.gon.recipe_filters = utils.removeDuplicateIds([...(res.locals.gon.recipe_filters||[]), ...records])
//  })
//}

function fetchFoods(req, res, next) {
  fetchTableMiddleware('foods', {}, ['name'], next, (records) => {
    res.locals.gon.foods = utils.sortBy(records, 'name')
  })
}

function fetchUnits(req, res, next) {
  let attrs = ['name', 'value', 'is_weight', 'is_volume', 'show_fraction']
  fetchTableMiddleware('units', {}, attrs, next, (records) => {
    res.locals.gon.units = records
  })
}

function fetchNotes(req, res, next) {
  let ids = res.locals.gon.recipes.map(r=>r.id)
  fetchTableMiddleware('recipe_notes', {recipe_id: ids}, ['item_nb'], next, (records) => {
    res.locals.gon.notes = records
  })
}

//function fetchIngredientSections(req, res, next) {
//  let ids = res.locals.gon.recipes.map(r=>r.id)
//  let attrs = ['before_ing_nb', 'name', 'recipe_id']
//  fetchTableMiddleware('ingredient_sections', {recipe_id: ids}, attrs, next, (records) => {
//    res.locals.gon.ingredient_sections = records
//  })
//}

function fetchImages(req, res, next) {
  let ids1 = res.locals.gon.recipes.map(r=>r.image_id).filter(x=>x)
  let ids2 = res.locals.gon.recipe_kinds.map(r=>r.image_id).filter(x=>x)
  let ids3 = res.locals.gon.tags.map(t=>(t.image_slug || '').split('.')[0]).filter(x=>x)
  let ids = [...ids1, ...ids2, ...ids3]
  let attrs = ['author', 'source', 'filename', 'is_user_author']
  fetchTableMiddleware('images', {id: ids}, attrs, next, (records) => {
    res.locals.gon.images = records.map(im => {
      let ext = im.filename.substr(im.filename.lastIndexOf('.') + 1);
      im.slug = `${im.id}.${ext}`
      return im
    })
  })
}

function fetchUserImages(req, res, next) {
  let attrs = ['author', 'source', 'filename', 'is_user_author']
  fetchTableMiddleware('images', {user_id: req.user.user_id}, attrs, next, (records) => {
    res.locals.gon.images = records
  })
}

//  create_table "active_storage_attachments", force: :cascade do |t|
//    t.string "name", limit: 255, null: false
//    t.string "record_type", limit: 255, null: false
//    t.bigint "record_id", null: false
//    t.bigint "blob_id", null: false
//    t.datetime "created_at", precision: nil, null: false
//    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
//    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
//  end
//  
//  create_table "active_storage_blobs", force: :cascade do |t|
//    t.string "key", limit: 255, null: false
//    t.string "filename", limit: 255, null: false
//    t.string "content_type", limit: 255
//    t.text "metadata"
//    t.bigint "byte_size", null: false
//    t.string "checksum", limit: 255
//    t.datetime "created_at", precision: nil, null: false
//    t.string "service_name", limit: 255, null: false
//    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
//  end
//
//  create_table "active_storage_variant_records", force: :cascade do |t|
//    t.bigint "blob_id", null: false
//    t.string "variation_digest", limit: 255, null: false
//    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
//  end


export function initGon(req, res, next) {
  res.locals.gon = {}; next()
}

// WARNING: LIST ORDER IS IMPORTANT
const fetchAll = [initGon, fetchAccountUsers, fetchRecipes, fetchFavoriteRecipes, fetchFavoriteRecipesRecipe, fetchRecipeKinds, fetchMixes, fetchMachineUsers, fetchMachines, fetchContainerFormats, fetchContainerQuantities, fetchContainers, fetchSuggestions, fetchTags, fetchFoods, fetchUnits, fetchNotes, fetchImages, fetchMachineFoods, fetchFriendsRecipes]

const gon = {fetchAll, fetchAccountUsers, fetchUserImages};
export default gon;
//module.exports = gon;
