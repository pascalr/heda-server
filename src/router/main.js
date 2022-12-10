import express from 'express';
import { fileURLToPath } from 'url';
import sharp from 'sharp'
import path from 'path';
import _ from 'lodash';

import { db } from '../db.js';
import { ensureUser } from './login.js';
import { localeHref, now, shuffle } from '../utils.js';
import { tr } from '../translate.js'
import schema from '../schema.js'
import { fetchWithAncestors, fetchTableLocaleAttrs, fetchRecordLocaleAttrs, descriptionRecipeIngredients, kindAncestorId } from "../lib.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let p = process.env.VOLUME_PATH
let VOLUME_FOLDER = p[0] == '.' ? path.join(__dirname, '..', p) : p
let IMAGE_FOLDER = path.join(VOLUME_FOLDER, 'images')

const RECIPE_ATTRS = ['user_id', 'name', 'recipe_kind_id', 'main_ingredient_id', 'preparation_time', 'cooking_time', 'total_time', 'json', 'ingredients', 'image_slug', 'original_id', 'is_public', 'heda_instructions', 'raw_servings']

function executeChain(req, res, next, chain) {
  for (let i = 0; i < chain.length; i += 1) {
    let nextCalled = false
    if (i === chain.length-1) {
      chain[i](req, res, next)
    } else {
      chain[i](req, res, (val) => {
        if (val) {return next(val)} // An error has occured
        nextCalled = true
      })
    }
    if (!nextCalled) {return}
  }
}


//const ensureLogIn = connectEnsureLogin.ensureLoggedIn;
//const ensureLoggedIn = ensureLogIn();
const router = express.Router();

router.post('/log_error', function(req, res, next) {

  let err = _.pick(req.body, ['url', 'error', 'info'])
  err.user_id = req.user?.user_id || null
  let opts = {allow_write: ['url', 'error', 'info', 'user_id']}
  let error = db.createRecord('errors', err, {force: true}, opts)
  res.send('ok')
});

router.post('/upload_image', function(req, res, next) {

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  let file = req.files['file'];
  let ext = file.name.substr(file.name.lastIndexOf('.') + 1).toLowerCase();
  if (!['jpg', 'jpeg', 'png'].includes(ext)) {
    // FIXME: Send the user locale from the client side in order to translate properly.
    return res.status(500).json({publicError: tr('Image_format_not_supported', res.locals.locale) + ext});
  }

  let {record_table, record_id, record_field} = req.body

  db.transaction(() => {

    let lastId = db.prepare('SELECT MAX(id) from images').get()['MAX(id)']
    let slug = `${lastId+1}.${ext}`
    let image = {filename: file.name, slug}
    image = db.createRecord('images', image, req.user, {allow_write: ['slug']})
    if (image.id != lastId +1) {throw "Database invalid state for images."}
    db.findAndUpdateRecord(record_table, record_id, {[record_field]: slug}, req.user)

    const promises = [];
    let stream = sharp(file.data)

    // OPTIMIZE: It would be better if the latter resizes used the previous ones?
    let out1 = path.join(IMAGE_FOLDER, "original", slug)
    let opts = {width: 800, height: 800, fit: 'inside', withoutEnlargement: true}
    promises.push(stream.clone().resize(opts).toFile(out1));

    //let out2 = path.join(IMAGE_FOLDER, "medium", slug)
    //opts = {width: 452, height: 304, fit: 'cover', withoutEnlargement: true}
    //promises.push(stream.clone().resize(opts).toFile(out2));

    let out3 = path.join(IMAGE_FOLDER, "thumb", slug)
    opts = {width: 71, height: 48, fit: 'cover', withoutEnlargement: true}
    promises.push(stream.clone().resize(opts).toFile(out3));

    let out4 = path.join(IMAGE_FOLDER, "small", slug)
    opts = {width: 255, height: 171, fit: 'cover', withoutEnlargement: true}
    promises.push(stream.clone().resize(opts).toFile(out4));
    
    Promise.all(promises)
      .then(r => { console.log("Done processing image!"); res.json(image) })
          
      .catch(err => {
        console.error("Error processing files, let's clean it up", err);
        try {
          fs.unlinkSync(out1);
          //fs.unlinkSync(out2);
          fs.unlinkSync(out3);
          fs.unlinkSync(out4);
        } catch (e) {}
      });
  })()

});

router.get('/imgs/:variant/:slug', function(req, res, next) {

  let ext = req.params.slug.substr(req.params.slug.lastIndexOf('.') + 1);
  if (!['jpg', 'jpeg', 'png'].includes(ext)) {
    return res.status(500).send("Image format not supported. Expected jpg, jpeg or png. Was " + ext);
  }
 
  let variant = req.params.variant
  if (!['small', 'thumb', 'original'].includes(variant)) {
    return res.status(500).send("Image variant not supported. Expected small, thumb or original. Was " + variant);
  }


  var fileName = parseInt(req.params.slug.split('.')[0]).toString()+'.'+ext;
  res.sendFile(fileName, {root: path.join(IMAGE_FOLDER, variant)}, function (err) {
    if (err) { return next(err); }
    console.log('Sent:', fileName);
  });
});

router.post('/create_record/:table', function(req, res, next) {
 
  let record = db.createRecord(req.params.table, req.body.record, req.user)
  res.json({...record})
})

router.patch('/change_recipe_owner', function(req, res, next) {
    
  let recipeId = parseInt(req.body.recipeId)
  let newOwnerId = parseInt(req.body.newOwnerId)
  
  let users = db.fetchTable('users', {account_id: req.user.account_id}, ['name'])
  if (!users.map(u => u.id).includes(newOwnerId)) {
    throw new Error("ChangeRecipeOwner not allowed")
  }
  let recipe = db.prepare('SELECT id, user_id FROM recipes WHERE id = ?').get(recipeId)
  if (!users.map(u => u.id).includes(recipe.user_id)) {
    throw new Error("ChangeRecipeOwner not allowed")
  }
  let query = 'UPDATE recipes SET user_id = ?, updated_at = ? WHERE id = ?'
  let args = [newOwnerId, now(), recipeId]
  console.log('query', query)
  console.log('args', args)
  db.prepare(query).run(args)
  res.json({status: 'ok'})
});

router.patch('/update_field/:table/:id', ensureUser, function(req, res, next) {

  let {table, id} = req.params
  let {field, value} = req.body

  console.log('req.body', req.body)

  let info = db.findAndUpdateRecord(table, id, {[field]: value}, req.user)
  if (info.changes != 1) {return res.status(500).send("Unable to update record in database")}
  res.json({status: 'ok'})
});

function extractExplore(locale) {

  let kinds = fetchTableLocaleAttrs(db, 'kinds', {}, ['kind_id'], ['name'], locale)
  let recipeKinds = fetchTableLocaleAttrs(db, 'recipe_kinds', {}, ['image_slug', 'kind_id'], ['name'], locale)
  let recipeKindsByAncestorId = _.groupBy(recipeKinds, (k) => kindAncestorId(kinds, k))
  delete recipeKindsByAncestorId.undefined
  let kindIds = _.keys(recipeKindsByAncestorId).map(id => parseInt(id))
  kindIds.forEach(kindId => {
    // Randomize and limit to 10
    recipeKindsByAncestorId[kindId] = shuffle(recipeKindsByAncestorId[kindId]).slice(0,10)
  })
  kinds = kinds.filter(k => kindIds.includes(k.id))
  return {kinds, recipeKindsByAncestorId}
}

function extractUser(id) {

  let userId = parseInt(id)
  let user = db.fetchRecord('users', {id: userId}, ['name'])
  if (!user) {throw 'Unable to fetch user.'}
  // OPTIMIZE: No need to extract all RECIPE_ATTRS....
  let userRecipes = db.fetchTable('recipes', {user_id: userId, is_public: 1}, RECIPE_ATTRS)
  let favs = db.fetchTable('favorite_recipes', {user_id: userId}, ['recipe_id'])
  let fetchedIds = userRecipes.map(r => r.id)
  let missingRecipeIds = favs.map(r=>r.recipe_id).filter(id => !fetchedIds.includes(id))
  let favRecipes = db.fetchTable('recipes', {id: missingRecipeIds, is_public: 1}, RECIPE_ATTRS)
  return {user, userRecipes, favRecipes}
}

function extractRecipeKind(id, locale) {

  let recipeKind = fetchRecordLocaleAttrs(db, 'recipe_kinds', {id}, ['image_slug', 'kind_id'], ['name', 'json'], locale)
  if (!recipeKind) {throw 'Unable to extract recipe kind. Not existent.'}
  //let recipes = db.fetchTable('recipes', {is_public: 1, recipe_kind_id: recipeKind.id}, RECIPE_ATTRS)
  // FIXME: SELECT recipes.*
  let recipes = db.prepare("SELECT recipes.*, users.locale, users.name AS user_name FROM recipes JOIN users ON recipes.user_id = users.id WHERE recipes.is_public = 1 AND recipes.recipe_kind_id = ?;").all(recipeKind.id)
  if (recipeKind.kind_id) {
    let kindAncestors = fetchWithAncestors(recipeKind.kind_id, 'kind_id', (id) => (
      fetchRecordLocaleAttrs(db, 'kinds', {id}, ['kind_id'], ['name'], locale)
    ))
    return {recipeKind, recipes, kindAncestors}
  }
  return {recipeKind, recipes}
}

function extractKind(id, locale) {

  let ancestors = fetchWithAncestors(id, 'kind_id', (id) => (
    fetchRecordLocaleAttrs(db, 'kinds', {id}, ['kind_id'], ['name'], locale)
  ))
  let kind = ancestors.pop(-1)
  if (!kind) {throw 'Unable to fetch kind. Not existent.'}
  let kinds = fetchTableLocaleAttrs(db, 'kinds', {kind_id: id}, ['kind_id'], ['name'], locale)
  kinds.forEach(k => {
    k.recipeKinds = fetchTableLocaleAttrs(db, 'recipe_kinds', {kind_id: k.id}, ['image_slug', 'kind_id'], ['name', 'recipe_count'], locale, {limit: 10})
  })
  let recipeKinds = fetchTableLocaleAttrs(db, 'recipe_kinds', {kind_id: id}, ['image_slug', 'kind_id'], ['name', 'recipe_count'], locale)
  return {kind, ancestors, kinds, recipeKinds}
}

router.get('/fetch_user/:id', (req, res, next) => res.json(extractUser(req.params.id)))
router.get('/fetch_explore', (req, res, next) => res.json(extractExplore(res.locals.locale)))
router.get('/fetch_kind/:id', (req, res, next) => res.json(extractKind(req.params.id, res.locals.locale)))
router.get('/fetch_recipe_kind/:id', (req, res, next) => res.json(extractRecipeKind(req.params.id, res.locals.locale)))

router.get('/fetch_suggestions', function(req, res, next) {

  let answers = req.query.answers.split(',')
  console.log('answers', answers)
  
  let recipeKinds = fetchTableLocaleAttrs(db, 'recipe_kinds', {}, ['image_slug', ...schema.recipe_kinds.data.data_attrs], ['name', 'recipe_count'], res.locals.locale)
  let suggestions = _.sortBy(recipeKinds, k => {
    let score = Math.random()*0.001
    answers.forEach(answer => {
      if (answer) {console.log('here', answer); score = score + (k[answer]||0.0); console.log('there', score)}
    })
    return score
  }).reverse()
  // Don't send search data to the user, only what is necessary.
  let result = suggestions.slice(0,10).map(k => _.pick(k, ['id', 'name', 'image_slug', 'recipe_count']))
  res.json({suggestions: result, nbSuggestions: suggestions.length})
})

router.get('/fetch_explore_users', function(req, res, next) {

  let users = db.fetchTable('users', {}, ['name', 'image_slug'])
  // FIXME: Add limit inside SQL, but limit per user id, not total
  let recipes = db.fetchTable('recipes', {is_public: 1, user_id: users.map(u => u.id)}, RECIPE_ATTRS)
  let recipesByUserId = _.groupBy(recipes, 'user_id')
  let userIds = _.keys(recipesByUserId).map(id => parseInt(id))
  userIds.forEach(userId => {
    // Randomize and limit to 10
    recipesByUserId[userId] = shuffle(recipesByUserId[userId]).slice(0,10)
  })
  users = users.filter(u => userIds.includes(u.id))
  res.json({users, recipesByUserId})
});

router.get('/fetch_recipe/:id', function(req, res, next) {

  let recipe = db.fetchRecord('recipes', {id: req.params.id}, RECIPE_ATTRS)
  if (!recipe) {throw "Can't fetch a recipe. Does not exist."}
  let user = db.fetchRecord('users', {id: recipe.user_id}, ['name'])
  if (!user || (recipe.is_private && user.account_id != req.user.account_id)) {
    throw "Can't fetch private recipe."
  }
  res.json({...recipe, user_name: user.name})
});

router.get('/fetch_search_data', function(req, res, next) {

  let recipeKinds = fetchTableLocaleAttrs(db, 'recipe_kinds', {}, ['image_slug'], ['name'], res.locals.locale)
  let publicUsers = db.fetchTable('users', {}, ['name', 'image_slug'])
  res.json({recipeKinds, publicUsers})
});

router.get('/fetch_image/:slug', function(req, res, next) {

  let attrs = ['author', 'source', 'is_user_author', 'slug']
  let image = db.fetchRecord('images', {slug: req.params.slug}, attrs)
  res.json(image)
});

// TODO: Do all the modifications inside a single transaction, and rollback if there is an error.
router.patch('/batch_modify', function(req, res, next) {

  let mods = JSON.parse(req.body.mods)
  let applyMods = db.transaction((mods) => {
    mods.forEach(({method, tableName, id, field, value}) => {
      if (method == 'UPDATE') {
        let info = db.findAndUpdateRecord(tableName, id, {[field]: value}, {user_id: req.user.user_id})
        if (info.changes != 1) {throw "Unable to update record in database"}
      }
    })
  })
  applyMods(mods)
  res.json({status: 'ok'})
});

router.delete('/destroy_record/:table/:id', function(req, res, next) {

  let {id, table} = req.params
  db.findAndDestroyRecordWithDependants(table, id, req.user)
  res.json({status: 'ok'})
});

const renderApp = [ensureUser, function(req, res, next) {

  let user = req.user
  let o = {}
  let attrs = null
  let ids = null
  //o.users = db.fetchTable('users', {account_id: user.account_id}, ['name', 'image_slug', 'locale', 'is_public'])
  // o.users = db.fetchTable('users', {account_id: user.account_id}, ['name', 'image_slug', 'locale'])
  // let profile = o.users.find(u => u.id == user.user_id)
  o.siblings = db.fetchTable('users', {account_id: user.account_id}, ['name']).filter(u => u.id != user.id)
  o.recipes = db.fetchTable('recipes', {user_id: user.user_id}, RECIPE_ATTRS)
  o.favorite_recipes = db.fetchTable('favorite_recipes', {user_id: user.user_id}, ['list_id', 'recipe_id', 'updated_at'])
  let recipeIds = o.recipes.map(r => r.id)
  let missingRecipeIds = o.favorite_recipes.map(r=>r.recipe_id).filter(id => !recipeIds.includes(id))
  o.recipes = [...o.recipes, ...db.fetchTable('recipes', {id: missingRecipeIds}, RECIPE_ATTRS)]
  o.recipe_kinds = fetchTableLocaleAttrs(db, 'recipe_kinds', {}, ['image_slug', 'kind_id'], ['name', 'recipe_count'], req.locale)
  //attrs = ['name', 'instructions', 'recipe_id', 'original_recipe_id']
  //o.mixes = db.fetchTable('mixes', {user_id: user.user_id}, attrs)
  o.machine_users = db.fetchTable('machine_users', {user_id: user.user_id}, ['machine_id'])
  o.machines = db.fetchTable('machines', {id: o.machine_users.map(m=>m.id)}, ['name'])
  //o.container_formats = db.fetchTable('container_formats', {}, ['name'])
  //attrs = ['container_format_id', 'machine_food_id', 'full_qty_quarters']
  //o.container_quantities = db.fetchTable('container_quantities', {}, attrs)
  //ids = o.machines.map(m=>m.id)
  //attrs = ['jar_id', 'machine_id', 'container_format_id', 'pos_x', 'pos_y', 'pos_z', 'food_id']
  //o.containers = db.fetchTable('containers', {machine_id: ids}, attrs)
  //attrs = ['user_id', 'recipe_id', 'tag_id', 'score']
  //o.suggestions = db.fetchTable('suggestions', {user_id: user.user_id}, attrs)
  //attrs = ['name', 'image_slug', 'user_id', 'position']
  //o.tags = db.fetchTable('tags', {user_id: user.user_id}, attrs)
  //o.foods = db.fetchTable('foods', {}, ['name'])
  //attrs = ['name', 'value', 'is_weight', 'is_volume', 'show_fraction']
  //o.units = db.fetchTable('units', {}, attrs)

  //let suggestionTagsIds = [16,9,17]
  //o.suggestion_tags = db.fetchTable('tags', {id: suggestionTagsIds}, ['name'])
  //o.recipe_suggestions = {}
  //o.suggestion_tags.forEach(t => {
  //  let results = db.prepare("SELECT recipes.id, recipes.name, recipes.image_slug FROM suggestions JOIN recipes ON suggestions.recipe_id = recipes.id JOIN users ON recipes.user_id = users.id WHERE users.is_public = 1 AND users.id <> ? AND recipes.image_slug IS NOT NULL AND recipes.image_slug <> '' AND suggestions.tag_id = ? ORDER BY random() LIMIT 10;").all(user.user_id, t.id)
  //  if (results && results.length > 0) {o.recipe_suggestions[t.name] = results}
  //})

  //o.recipe_suggestions = db.prepare("SELECT recipes.id, recipes.name, recipes.image_slug, users.name AS user_name FROM recipes JOIN users ON recipes.user_id = users.id WHERE users.is_public = 1 AND users.id <> ? AND recipes.image_slug IS NOT NULL AND recipes.image_slug <> '' ORDER BY random() LIMIT 10;").all(user.user_id)

  //let slugs1 = o.recipes.map(r=>r.image_slug).filter(x=>x)
  ////let slugs2 = o.recipe_kinds.map(r=>r.image_slug).filter(x=>x)
  //let slugs3 = o.tags.map(t=>t.image_slug).filter(x=>x)
  //ids = [...slugs1, ...slugs3].map(s => s.split('.')[0])
  //attrs = ['author', 'source', 'filename', 'is_user_author', 'slug']
  //o.images = db.fetchTable('images', {id: ids}, attrs)

  //o.machine_foods = db.fetchTable('machine_foods', {}, ['food_id', 'machine_id'])


  // FIXME: FRIENDS OR "SAME ACCOUNT" RECIPES
  // ids = o.users.map(u => u.id).filter(id => id != user.user_id)
  // o.friends_recipes = db.fetchTable('recipes', {user_id: ids}, ['name', 'user_id', 'image_slug', 'recipe_kind_id'])
  o.friends_recipes = db.fetchTable('recipes', {user_id: req.user.id}, ['name', 'user_id', 'image_slug', 'recipe_kind_id'])

  res.locals.gon = {...res.locals.gon, ...o}
  next()
}, function(req, res, next) {
  res.render('index', { account: req.user });
}]

function renderAppIfLoggedIn(req, res, next) {
  if (req.user && req.user.user_id) { executeChain(req, res, next, renderApp) }
  else {return next();}
}

router.get('/e/:id', renderApp)
router.get('/c', renderApp)
router.get('/g', renderApp)
router.get('/s', renderApp)
router.get('/t/:id', renderApp)
router.get('/l', renderApp)
router.get('/n', renderApp)
router.get('/m/:id', renderApp)
router.get('/m/:id/i', renderApp)
router.get('/m/:id/l', renderApp)
router.get('/m/:machineId/s/:id', renderApp)
router.get('/m/:machineId/e/:id', renderApp)

router.get('/r/:id', renderAppIfLoggedIn, function(req, res, next) {

  let recipeId = req.params.id
  let o = {}
  o.recipe = db.fetchRecord('recipes', {id: recipeId, is_public: 1}, RECIPE_ATTRS)
  if (!o.recipe) {throw 'Unable to fetch recipe. Not existent or private.'}
  //if (res.locals.locale != o.user.locale) {
  //  // TODO: Fetch in the proper locale
  //  attrs = ['name', 'servings_name', 'original_id', 'ingredients', 'json']
  //  o.translated_recipe = db.fetchRecord('translated_recipes', {original_id: recipeId}, attrs)
  //}

  //if (o.recipe.recipe_kind_id) {
  //  let attrs = ['name', 'description_json', 'image_slug']
  //  // FIXME: Create and use fetchRecord or findRecord, not fetchTable
  //  o.recipe_kind = db.fetchTable('recipe_kinds', {id: o.recipe.recipe_kind_id}, attrs)[0]
  //}
  if (o.recipe.recipe_kind_id) {
    o.recipe_kind = fetchRecordLocaleAttrs(db, 'recipe_kinds', {id: o.recipe.recipe_kind_id}, ['kind_id'], ['name'], res.locals.locale)
    if (o.recipe_kind.kind_id) {
      o.kind_ancestors = fetchWithAncestors(o.recipe_kind.kind_id, 'kind_id', (id) => (
        fetchRecordLocaleAttrs(db, 'kinds', {id}, ['kind_id'], ['name'], res.locals.locale)
      ))
    }
  }
 
  res.locals.descriptionRecipeIngredients = descriptionRecipeIngredients
  res.locals.gon = o
  res.render('show_recipe');
});

router.get('/d/:id', renderAppIfLoggedIn, function(req, res, next) {

  res.locals.gon = extractKind(req.params.id, res.locals.locale)
  res.render('show_kind');
});

router.get('/k/:id', renderAppIfLoggedIn, function(req, res, next) {

  res.locals.gon = extractRecipeKind(req.params.id, res.locals.locale)
  res.render('show_recipe_kind');
});

router.get('/x', renderAppIfLoggedIn, function(req, res, next) {

  // Whether or not to show an HTML cached version while the JS is loading.
  res.locals.disablePreview = req.query.disablePreview

  res.locals.gon = extractExplore(res.locals.locale)
  res.render('show_explore');
});

router.get('/u/:id', renderAppIfLoggedIn, function(req, res, next) {

  res.locals.gon = extractUser(req.params.id)
  res.render('show_user');
});

router.get('/error', function(req, res, next) {
  return res.render('error');
})

router.get('/contact', function(req, res, next) {
  return res.render('contact');
})

const renderHome = function(req, res, next) {

  // Whether or not to show an HTML cached version while the JS is loading.
  res.locals.disablePreview = req.query.disablePreview

  // Use this to generate gon, but then use JSON.stringify(gon) and copy paste directly inside home.jsx
  let id = (res.locals.locale != 'fr') ? 773 : 82
  let o = {}
  o.recipe = db.fetchRecord('recipes', {id}, RECIPE_ATTRS)
  //o.kinds = fetchTableLocaleAttrs(db, 'kinds', {id: [1,6]}, [], ['name'], res.locals.locale)
  //o.kinds.forEach(k => {
  //  k.recipeKinds = fetchTableLocaleAttrs(db, 'recipe_kinds', {kind_id: k.id}, ['image_slug', 'kind_id'], ['name', 'recipe_count'], res.locals.locale, {limit: 10})
  //})
  res.locals.gon = o
  res.render('home');
}
router.get('/h', renderHome);

/* GET home page. */
router.get('/', renderAppIfLoggedIn, function(req, res, next) {
  // if (req.user && !req.user.user_id) { return res.redirect(localeHref('/choose_user', req.originalUrl)) }
  renderHome(req, res, next)
})

router.post('/duplicate_recipe/:id', function(req, res, next) {

  let recipe = db.fetchRecord('recipes', {id: req.params.id, is_public: 1}, RECIPE_ATTRS)
  if (!recipe) {throw "Can't duplicate a recipe. Does not exist or is private."}
  let newRecipe = {...recipe, original_id: recipe.id}
  delete newRecipe.id; delete newRecipe.user_id;
  newRecipe = db.createRecord('recipes', newRecipe, req.user, {allow_write: ['original_id']})
  res.json(newRecipe)
});

export default router;