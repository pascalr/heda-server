import express from 'express';
import createError from 'http-errors';

import { db } from './db.js';
import analytics from './analytics.js'
import { kindAncestorId } from "./lib.js"
import { fetchKinds, fetchRecipeKinds, fetchRecipeKinds2 } from "./lib.js"

const router = express.Router();

// All the routes here are only available to users that are admin.
// Respond with 404 if the user is not an admin.
router.use((req, res, next) => {
  if (req.user?.is_admin) {return next()}
  next(createError(404));
})

const renderAdmin = (req, res, next) => {

  let recipeKinds = fetchRecipeKinds2(db, {}, res.locals.locale, ['name_fr', 'json_fr', 'name_en', 'json_en', 'kind_id', 'image_slug', 'recipe_count', 'is_meal', 'is_appetizer', 'is_dessert', 'is_simple', 'is_normal', 'is_gourmet', 'is_other', 'is_very_fast', 'is_fast', 'is_small_qty', 'is_big_qty', 'is_medium_qty'])

  res.locals.gon = {
    translations: db.fetchTable('translations', {}, ['from', 'to', 'original', 'translated']),
    recipe_kinds: recipeKinds,
    kinds: db.fetchTable('kinds', {}, ['name_fr', 'name_en', 'kind_id']),
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
router.post('/update_kinds_count', function(req, res, next) {

  let recipeKinds = fetchRecipeKinds(db, {}, res.locals.locale)
  recipeKinds.forEach(recipeKind => {
    let count = db.prepare('SELECT COUNT(*) FROM recipes WHERE is_public = 1 AND recipe_kind_id = ?').get(recipeKind.id)['COUNT(*)']
    if (recipeKind.recipe_count != count) {
      db.findAndUpdateRecord('recipe_kinds', recipeKind, {recipe_count: count}, req.user)
    }
  })
  res.send('Ok done!')
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
