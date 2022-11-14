import express from 'express';

const router = express.Router();

// All the routes here are only available to users that are admin.
router.use((req, res, next) => {
  if (req.user?.is_admin) {return next()}
  return next('Error account must be an admin.')
})

const renderAdmin = (req, res, next) => {
  res.locals.gon = {
    translations: db.fetchTable('translations', {}, ['from', 'to', 'original', 'translated']),
    recipe_kinds: db.fetchTable('recipe_kinds', {}, ['name_fr', 'json_fr', 'name_en', 'json_en', 'image_slug', 'kind_id', 'recipe_count']),
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
