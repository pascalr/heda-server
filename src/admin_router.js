import express from 'express';
import createError from 'http-errors';

import schema from './schema.js'
import { getTableList, safeNoQuotes, getWriteAttributes } from './lazy_db.js';
import { db } from './db.js';
import analytics from './analytics.js'
import { kindAncestorId, findRecipeKindForRecipeName } from "./lib.js"
import _ from 'lodash';

const router = express.Router();

const RECIPE_KIND_DATA_ATTRS = ['is_meal', 'is_appetizer', 'is_dessert', 'is_simple', 'is_normal', 'is_gourmet', 'is_other', 'is_very_fast', 'is_fast', 'is_small_qty', 'is_big_qty', 'is_medium_qty']

// All the routes here are only available to users that are admin.
// Respond with 404 if the user is not an admin.
router.use((req, res, next) => {
  if (req.user?.is_admin) {return next()}
  next(createError(404));
})

const renderAdmin = (req, res, next) => {

  let recipe_kinds = db.fetchTable('recipe_kinds', {}, ['name_fr', 'json_fr', 'name_en', 'json_en', 'kind_id', 'image_slug', 'recipe_count_fr', 'recipe_count_en', 'updated_at', ...RECIPE_KIND_DATA_ATTRS])
  let users = db.fetchTable('users', {account_id: req.user.account_id}, ['name', 'image_slug', 'locale'])

  res.locals.gon = {
    translations: db.fetchTable('translations', {}, ['from', 'to', 'original', 'translated']),
    recipe_kinds, users,
    user: users.find(u => u.id == req.user.user_id),
    kinds: db.fetchTable('kinds', {}, ['name_fr', 'name_en', 'kind_id']),
    errors: db.fetchTable('errors', {}, ['url', 'error', 'info', 'created_at']),
    recipes: db.fetchTable('recipes', {}, ['name', 'recipe_kind_id', 'image_slug']),
    stats: {
      nbUsers: db.prepare('SELECT COUNT(*) FROM users').get()['COUNT(*)'],
      nbAccounts: db.prepare('SELECT COUNT(*) FROM accounts').get()['COUNT(*)'],
      public_users: db.fetchTable('users', {}, ['name']),
      nbRequestsTotal: analytics.nbRequestsTotal(),
      nbDailyVisitsTotal: analytics.nbDailyVisitsTotal(),
    },
  }
  res.render('admin')
}

// ADMIN ROUTES
router.get('/admin', renderAdmin)
router.get('/admin/:page', renderAdmin)
router.get('/admin/:page/:id', renderAdmin)
router.post('/backup_db', function(req, res, next) {
  db.doBackup()
  res.send('Database backup successful.')
})
router.post('/calc_recipe_kinds', function(req, res, next) {

  throw 'Fix deprecated fetchKinds and fetchRecipeKinds'
  throw "Don't do this for all anymore. Maybe a button to do it for a single recipe, so it tries to save me time. Set the recipe kind based on it's kind."
  let kinds = fetchKinds(db, {}, res.locals.locale)
  let recipeKinds = fetchRecipeKinds(db, {}, res.locals.locale, true)
  recipeKinds.forEach(recipeKind => {
    let mealId = 17; let appetizerId = 35; let dessertId = 12;
    let ancestorId = kindAncestorId(kinds, recipeKind)
    console.log('ancestorId', ancestorId)
    let is_meal = 0.0
    let is_appetizer = 0.0
    let is_other = 0.0
    let is_dessert = 0.0
    if (ancestorId == mealId) {is_meal = 1.0}
    else if (ancestorId == appetizerId) {is_appetizer = 1.0}
    else if (ancestorId == dessertId) {is_dessert = 1.0}
    else {is_other = 1.0}
    db.findAndUpdateRecord('recipe_kinds', recipeKind, {is_meal, is_appetizer, is_other, is_dessert}, req.user)
  })

  res.send('OK')
})
router.post('/exe_sql', function(req, res, next) {
  db.doBackup()
  db.transaction(() => {
    db.exec(req.body.code)
    res.send('OK')
  })()
})
router.post('/translate_recipes', function(req, res, next) {
  db.doBackup()
  translateRecipes().then(missings => {
    res.json({missings})
  })
})
router.get('/fetch_all/:table', function(req, res, next) {
  let table = safeNoQuotes(req.params.table, getTableList(schema))
  let columns = getWriteAttributes(schema, table) || []
  let all = db.fetchTable(table, {}, columns)
  res.json(all)
});
router.get('/fetch_single/:table/:id', function(req, res, next) {
  let table = safeNoQuotes(req.params.table, getTableList(schema))
  let columns = getWriteAttributes(schema, table) || []
  let record = db.fetchRecord(table, {id: parseInt(req.params.id)}, columns)
  res.json(record)
});
router.post('/translate_recipe/:id', function(req, res, next) {

  let recipe = db.fetchRecord('recipes', {id: req.params.id}, RECIPE_ATTRS)
  let from = 1 // French FIXME
  let to = 4 // English FIXME
  let translations = db.fetchTable('translations', {}, ['from', 'to', 'original', 'translated'])
  let cache = new TranslationsCacheStrategy(translations, from, to)
  let translator = new Translator(cache)
  translator.translateRecipe(recipe).then(translated => {
    let newRecipe = {...recipe, ...translated}
    delete newRecipe.id;
    newRecipe = db.createRecord('recipes', newRecipe, req.user, {allow_write: ['original_id']})
    res.json(newRecipe)
  })
});
router.post('/update_recipes_locale', function(req, res, next) {

  let recipes = db.prepare('SELECT recipes.id as id, recipes.locale as locale, user_id, users.locale as user_locale FROM recipes JOIN users ON users.id = recipes.user_id').all()
  recipes.forEach(recipe => {
    if (recipe.locale != recipe.user_locale) {
      db.findAndUpdateRecord('recipes', recipe, {locale: recipe.user_locale}, {user_id: recipe.user_id}, {allow_write: 'locale'})
    }
  }) 
  res.send('Ok done!')
})
router.post('/update_kinds_count', function(req, res, next) {

  let recipeKinds = db.fetchTable('recipe_kinds', {}, ['recipe_count_fr', 'recipe_count_en'])
  recipeKinds.forEach(recipeKind => {
    let countFr = db.prepare("SELECT COUNT(*) FROM recipes WHERE is_public = 1 AND recipe_kind_id = ? AND locale = 'fr'").get(recipeKind.id)['COUNT(*)']
    let countEn = db.prepare("SELECT COUNT(*) FROM recipes WHERE is_public = 1 AND recipe_kind_id = ? AND locale = 'en'").get(recipeKind.id)['COUNT(*)']
    if (recipeKind.recipe_count_fr != countFr) {
      db.findAndUpdateRecord('recipe_kinds', recipeKind, {recipe_count_fr: countFr}, req.user)
    }
    if (recipeKind.recipe_count_en != countEn) {
      db.findAndUpdateRecord('recipe_kinds', recipeKind, {recipe_count_en: countEn}, req.user)
    }
  })
  res.send('Ok done!')
})
router.post('/average_recipe_kind/:id', function(req, res, next) {
  
  let recipeKind = db.fetchRecord('recipe_kinds', {id: req.params.id}, ['kind_id'])
  let siblings = db.fetchTable('recipe_kinds', {kind_id: recipeKind.kind_id}, RECIPE_KIND_DATA_ATTRS)
  siblings = siblings.filter(k => k.id != recipeKind.id)

  if (siblings?.length) {
    let data = {}
    RECIPE_KIND_DATA_ATTRS.forEach(attr => {
      data[attr] = _.mean(siblings.map(k => k[attr]))
    })
    console.log('siblings', siblings)
    console.log('data', data)
    db.findAndUpdateRecord('recipe_kinds', recipeKind, data, req.user)
    res.send('Ok done!')
  }
})
router.post('/match_recipe_kinds', function(req, res, next) {

  let recipeKinds = db.fetchTable('recipe_kinds', {}, ['name_fr', 'name_en'])
  let recipes = db.fetchTable('recipes', {recipe_kind_id: null}, ['name', 'recipe_kind_id', 'user_id'])
  recipes.forEach(recipe => {
    if (recipe.recipe_kind_id) {return console.log('Skipping recipe already has a recipe_kind_id')}
    let recipeKind = findRecipeKindForRecipeName(recipe.name, recipeKinds)
    if (recipeKind) {
      console.log('Found recipe kind ', recipeKind.name)
      db.findAndUpdateRecord('recipes', recipe, {'recipe_kind_id': recipeKind.id}, {user_id: recipe.user_id})
    }
  })
  res.send('Ok done!')
})

export default router;
