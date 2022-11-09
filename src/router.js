import express from 'express';
import crypto from 'crypto';
import connectEnsureLogin from 'connect-ensure-login'
import { fileURLToPath } from 'url';
import sharp from 'sharp'
import path from 'path';

import { db } from './db.js';
import passport from './passport.js';
import { localeHref, now, ensureIsArray } from './utils.js';
import { tr } from './translate.js'
import { translateRecipes } from '../tasks/translate_recipes.js'
import Translator, { TranslationsCacheStrategy, LogStrategy } from './translator.js'
import { findRecipeKindForRecipeName, fetchRecipeKinds, fetchRecipeKind, descriptionRecipeIngredients, fetchKindWithAncestors } from "./lib.js"
import analytics from './analytics.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let p = process.env.VOLUME_PATH
let VOLUME_FOLDER = p[0] == '.' ? path.join(__dirname, '..', p) : p
let IMAGE_FOLDER = path.join(VOLUME_FOLDER, 'images')

const RECIPE_ATTRS = ['user_id', 'name', 'recipe_kind_id', 'main_ingredient_id', 'preparation_time', 'cooking_time', 'total_time', 'json', 'ingredients', 'image_slug', 'servings_name', 'original_id']

//const ensureLogIn = connectEnsureLogin.ensureLoggedIn;
//const ensureLoggedIn = ensureLogIn();
const router = express.Router();

const ensureLoggedIn = function(req, res, next) {
  if (req.user && req.user.account_id) {return next()}
  res.redirect('/')
  //next("Error the account is not logged in...")
}
const ensureUser = function(req, res, next) {
  if (req.user && req.user.user_id) {return next()}
  res.redirect('/')
  //next("Error the account is not logged in or the user is not selected...")
}

function initGon(req, res, next) {
  res.locals.gon = {}; next()
}

function fetchAccountUsers(req, res, next) {
  let attrs = ['name', 'gender', 'image_slug', 'locale', 'is_public']
  res.locals.users = db.fetchTable('users', {account_id: req.user.account_id}, attrs)
  if (res.locals.gon) {res.locals.gon.users = res.locals.users}
  next()
}

router.get('/search', function(req, res, next) {
  let query = req.query.q
  let tokens = query.replace(' ', '%')

  // TODO: Create another field for recipes called name_search, where it is in lowercase and where there are no accents
  let recipes = db.prepare("SELECT recipes.id, recipes.name, recipes.image_slug, users.name AS user_name FROM recipes JOIN users ON recipes.user_id = users.id WHERE users.locale = ? AND users.is_public = 1 AND recipes.name LIKE '%"+tokens+"%' COLLATE NOCASE LIMIT 30;").all(res.locals.locale)

  let users = db.prepare("SELECT id, name, image_slug FROM users WHERE is_public = 1 AND name LIKE '%"+tokens+"%' COLLATE NOCASE LIMIT 30;").all()

  res.json({query, results: {recipes, users}})
});

function redirectHomeIfLoggedIn(req, res, next) {
  if (req.user && req.user.user_id) {
    res.redirect('/');
  } else {
    next()
  }
}

router.get('/login', redirectHomeIfLoggedIn, function(req, res, next) {
  res.render('login');
});

router.get('/choose_user', redirectHomeIfLoggedIn, fetchAccountUsers, function(req, res, next) {
  res.render('choose_user');
});

router.get('/new_user', function(req, res, next) {
  if (req.query.err) {res.locals.error = tr(req.query.err, res.locals.locale)}
  res.render('new_profile');
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

router.post('/create_user', function(req, res, next) {
  if (!req.user || !req.user.account_id) {return next('Must be logged in to create profile')}
  try {
    let info = db.prepare('INSERT INTO users (name, locale, account_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(req.body.name, req.body.locale, req.user.account_id, now(), now())
    req.user.user_id = info.lastInsertRowid;
    res.redirect('/');
  } catch (err) {
    res.redirect(localeHref('/new_user?err=Name_already_used', req.originalUrl));
  }
});

router.delete('/destroy_profile/:id', function(req, res, next) {

  if (!req.user.account_id) {return next('Must be logged in to destroy profile')}
  let id = req.params.id

  let query = 'DELETE FROM users WHERE id = ? AND account_id = ?'
  db.prepare(query).run(id, req.user.account_id)
  req.user.user_id = null
  res.json({status: 'ok'})
});

router.post('/choose_user', function(req, res, next) {
  req.user.user_id = req.body.user_id
  res.redirect('/');
});

router.post('/change_user', function(req, res, next) {
  req.user.user_id = req.body.user_id
  res.redirect('/');
});

router.post('/login/password', function(req, res, next) {
  passport.authenticate('local', {
    successReturnToOrRedirect: localeHref('/choose_user', req.originalUrl),
    failureRedirect: '/login',
    failureMessage: true
  })(req, res, next);
});

//router.post('/login/password', passport.authenticate('local', {
//  successReturnToOrRedirect: '/choose_user',
//  failureRedirect: '/login',
//  failureMessage: true
//}));

router.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect(localeHref('/', req.originalUrl));
  });
});

function setProfile(req, res, next) {
  if (!res.locals.gon?.users) next('Error set profile must be called after fetching profiles')
  let user = res.locals.gon.users.find(u => u.id == req.user.user_id)
  if (!user) {req.user.user_id = null; next('Error current profile not found in database. Database changed? Logging out of profile...')}
  res.locals.gon.user = {...user, is_admin: req.user.is_admin}
  res.locals.user = user
  next()
}

router.get('/edit_profile', initGon, fetchAccountUsers, setProfile, function(req, res, next) {
  res.render('edit_profile');
});

router.get('/edit_account', initGon, fetchAccountUsers, setProfile, function(req, res, next) {
  res.locals.gon.account = db.fetchRecord('accounts', {id: req.user.account_id}, ['email'])
  res.render('edit_account');
});

router.get('/signup', function(req, res, next) {
  if (req.query.err) {res.locals.error = tr(req.query.err, res.locals.locale)}
  res.render('signup');
});

/* POST /signup
 *
 * This route creates a new user account.
 *
 * A desired username and password are submitted to this route via an HTML form,
 * which was rendered by the `GET /signup` route.  The password is hashed and
 * then a new user record is inserted into the database.  If the record is
 * successfully created, the user is logged in.
 */
router.post('/signup', function(req, res, next) {
  var salt = crypto.randomBytes(16);
  crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function(err, hashedPassword) {
    if (err) { return next(err); }
    try {
      const info = db.prepare('INSERT INTO accounts (email, encrypted_password, salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(req.body.email, hashedPassword, salt, now(), now())
      var user = {
        account_id: info.lastInsertRowid,
        email: req.body.email
      };
      req.login(user, function(err) {
        if (err) { return next(err); }
        res.redirect(localeHref('/', req.originalUrl));
      });
    } catch (err) {
      if (err.code && err.code === "SQLITE_CONSTRAINT_UNIQUE") { // SqliteError
        res.redirect(localeHref('/signup?err=Account_already_associated', req.originalUrl));
      } else {
        res.redirect(localeHref('/signup?err=Error_creating', req.originalUrl));
      }
    }
  });
});

// https://stackoverflow.com/questions/20277020/how-to-reset-change-password-in-node-js-with-passport-js
router.get('/forgot', function (req, res, next) {
  if (req.isAuthenticated()) { return res.redirect('/'); /* user is alreay logged in */ }
  res.render('forgot');
});

// https://stackoverflow.com/questions/20277020/how-to-reset-change-password-in-node-js-with-passport-js
router.post('/forgot', function (req, res, next) {
  if (req.isAuthenticated()) { return res.redirect('/'); /* user is alreay logged in */ }
  users.forgot(req, res, function (err) {
    if (err) {
      req.flash('error', err);
    }
    else {
      req.flash('success', 'Please check your email for further instructions.');
    }
    res.redirect('/');
  });
});

// https://stackoverflow.com/questions/20277020/how-to-reset-change-password-in-node-js-with-passport-js
router.get('/reset/:token', function (req, res, next) {
  if (req.isAuthenticated()) { return res.redirect('/'); /* user is alreay logged in */ }

  var token = req.params.token;
  res.locals.token = token;
  //users.checkReset(token, req, res, function (err, data) {
  //  if (err)
  //    req.flash('error', err);

  //  //show the UI with new password entry
  //  res.render('reset');
  //});
  res.render('reset');
});

// https://stackoverflow.com/questions/20277020/how-to-reset-change-password-in-node-js-with-passport-js
router.post('/reset', function (req, res, next) {
  if (req.isAuthenticated() || !req.body.token) { return res.redirect('/'); /* user is alreay logged in */ }
  
  var salt = crypto.randomBytes(16);
  crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function(err, hashedPassword) {
    if (err) { return next(err); }
    let info = db.prepare('UPDATE accounts SET encrypted_password = ?, salt = ?, updated_at = ? WHERE reset_password_token = ?').run(hashedPassword, salt, now(), req.body.token)
    var user = {
      id: this.lastInsertRowid,
      username: req.body.username
    };
    req.login(user, function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
    
  });
});

router.get('/imgs/:variant/:slug', function(req, res, next) {

  // TODO: Send only variants, not original
  
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
 
  let o = req.body.record
  let record = db.createRecord(req.params.table, o, req.user)
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

// WARNING: All users have access to these
const ALLOWED_COLUMNS_GET = {
  'recipes': RECIPE_ATTRS
}
router.get('/fetch_record/:table/:id', function(req, res, next) {

  let id = req.params.id
  let table = req.params.table
  if (Object.keys(ALLOWED_COLUMNS_GET).includes(table)) {
    const record = db.fetchRecord(table, {id: id}, ALLOWED_COLUMNS_GET[table])
    res.json({...record})
  } else {
    throw new Error("FetchRecord not allowed")
  }
});
router.get('/fetch_recipe/:id', function(req, res, next) {

  let recipe = db.fetchRecord('recipes', {id: req.params.id}, RECIPE_ATTRS)
  let user = db.fetchRecord('users', {id: recipe.user_id}, ['is_public', 'name'])
  if (!user || (!user.is_public && user.account_id !== req.user.account_id)) {throw "Can't fetch a private recipe."}
  res.json({...recipe, user_name: user.name})
});
router.get('/fetch_recipe_kind/:id', function(req, res, next) {

  let recipeKind = fetchRecipeKind(db, {id: req.params.id}, res.locals.locale)
  // FIXME: SELECT recipes.*
  let recipes = db.prepare("SELECT recipes.*, users.name AS user_name FROM recipes JOIN users ON recipes.user_id = users.id WHERE users.locale = ? AND users.is_public = 1 AND recipes.recipe_kind_id = ?;").all(res.locals.locale, recipeKind.id)
  if (recipeKind.kind_id) {
    let kindAncestors = fetchKindWithAncestors(db, {id: recipeKind.kind_id}, res.locals.locale)
    res.json({recipeKind, recipes, kindAncestors})
  } else {
    res.json({recipeKind, recipes})
  }
});
router.get('/fetch_search_data', function(req, res, next) {

  let recipeKinds = fetchRecipeKinds(db, {}, res.locals.locale, false)
  let publicUsers = db.fetchTable('users', {is_public: 1}, ['name', 'image_slug'])
  res.json({recipeKinds, publicUsers})
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

router.get('/demo', function(req, res, next) {
  next()
});

const renderApp = [ensureUser, function(req, res, next) {

  let user = req.user
  let o = {}
  let attrs = null
  let ids = null
  o.users = db.fetchTable('users', {account_id: user.account_id}, ['name', 'gender', 'image_slug', 'locale', 'is_public'])
  let profile = o.users.find(u => u.id == user.user_id)
  o.recipes = db.fetchTable('recipes', {user_id: user.user_id}, RECIPE_ATTRS)
  o.favorite_recipes = db.fetchTable('favorite_recipes', {user_id: user.user_id}, ['list_id', 'recipe_id', 'updated_at'])
  let recipeIds = o.recipes.map(r => r.id)
  let missingRecipeIds = o.favorite_recipes.map(r=>r.recipe_id).filter(id => !recipeIds.includes(id))
  o.recipes = [...o.recipes, ...db.fetchTable('recipes', {id: missingRecipeIds}, RECIPE_ATTRS)]
  o.recipe_kinds = fetchRecipeKinds(db, {}, profile.locale, false)
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

  //let suggestionTagsIds = [16,9,17]
  //o.suggestion_tags = db.fetchTable('tags', {id: suggestionTagsIds}, ['name'])
  //o.recipe_suggestions = {}
  //o.suggestion_tags.forEach(t => {
  //  let results = db.prepare("SELECT recipes.id, recipes.name, recipes.image_slug FROM suggestions JOIN recipes ON suggestions.recipe_id = recipes.id JOIN users ON recipes.user_id = users.id WHERE users.is_public = 1 AND users.id <> ? AND recipes.image_slug IS NOT NULL AND recipes.image_slug <> '' AND suggestions.tag_id = ? ORDER BY random() LIMIT 10;").all(user.user_id, t.id)
  //  if (results && results.length > 0) {o.recipe_suggestions[t.name] = results}
  //})

  //o.recipe_suggestions = db.prepare("SELECT recipes.id, recipes.name, recipes.image_slug, users.name AS user_name FROM recipes JOIN users ON recipes.user_id = users.id WHERE users.is_public = 1 AND users.id <> ? AND recipes.image_slug IS NOT NULL AND recipes.image_slug <> '' ORDER BY random() LIMIT 10;").all(user.user_id)

  let slugs1 = o.recipes.map(r=>r.image_slug).filter(x=>x)
  //let slugs2 = o.recipe_kinds.map(r=>r.image_slug).filter(x=>x)
  let slugs3 = o.tags.map(t=>t.image_slug).filter(x=>x)
  ids = [...slugs1, ...slugs3].map(s => s.split('.')[0])
  attrs = ['author', 'source', 'filename', 'is_user_author', 'slug']
  o.images = db.fetchTable('images', {id: ids}, attrs)

  o.machine_foods = db.fetchTable('machine_foods', {}, ['food_id', 'machine_id'])
  ids = o.users.map(u => u.id).filter(id => id != user.user_id)
  o.friends_recipes = db.fetchTable('recipes', {user_id: ids}, ['name', 'user_id', 'image_slug', 'recipe_kind_id'])
  
  res.locals.gon = o
  next()
}, setProfile, function(req, res, next) {
  res.render('index', { account: req.user });
}]

router.get('/e/:id', renderApp)
router.get('/c', renderApp)
router.get('/t/:id', renderApp)
router.get('/l', renderApp)
router.get('/n', renderApp)
router.get('/m/:id', renderApp)
router.get('/m/:id/i', renderApp)
router.get('/m/:id/l', renderApp)
router.get('/m/:machineId/s/:id', renderApp)
router.get('/m/:machineId/e/:id', renderApp)

router.get('/r/:id', function(req, res, next) {

  if (req.user && req.user.user_id) { return next(); }

  let recipeId = req.params.id
  let o = {}
  let ids = null
  let attrs = null
  o.recipe = db.fetchRecord('recipes', {id: recipeId}, RECIPE_ATTRS)
  if (!o.recipe) {throw 'Unable to fetch recipe. Not existent.'}
  o.user = db.fetchRecord('users', {id: o.recipe.user_id, is_public: 1}, ['name', 'locale'])
  if (!o.user) {throw 'Unable to fetch recipe. No permission by user.'}
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

  let slugs = [o.recipe.image_slug, o.recipe_kind ? o.recipe_kind.image_slug : null].filter(x=>x)
  ids = slugs.map(s => s.split('.')[0])
  attrs = ['author', 'source', 'filename', 'is_user_author', 'slug']
  o.images = db.fetchTable('images', {id: ids}, attrs)
 
  res.locals.descriptionRecipeIngredients = descriptionRecipeIngredients
  res.locals.gon = o
  res.render('show_recipe');
}, renderApp);

router.get('/d/:id', function(req, res, next) {

  if (req.user && req.user.user_id) { return next(); }

  let o = {}
  let id = parseInt(req.params.id)
  o.ancestors = fetchKindWithAncestors(db, {id}, res.locals.locale)
  o.kind = o.ancestors.pop(-1)
  if (!o.kind) {throw 'Unable to fetch kind. Not existent.'}
  o.kinds = fetchKinds(db, {kind_id: id}, res.locals.locale)
  o.recipe_kinds = fetchRecipeKinds(db, {kind_id: id}, res.locals.locale)

  res.locals.gon = o
  res.render('show_kind');
}, renderApp);

router.get('/k/:id', function(req, res, next) {

  if (req.user && req.user.user_id) { return next(); }

  let o = {}
  o.recipe_kind = fetchRecipeKind(db, {id: req.params.id}, res.locals.locale)
  if (!o.recipe_kind) {throw 'Unable to fetch recipe kind. Not existent.'}

  if (o.recipe_kind.kind_id) {
    o.kind_ancestors = fetchKindWithAncestors(db, {id: o.recipe_kind.kind_id}, res.locals.locale)
  }

  // FIXME: recipes.*
  //o.recipes = db.prepare("SELECT recipes.*, users.name AS user_name FROM recipes JOIN users ON recipes.user_id = users.id WHERE users.is_public = 1 AND recipes.recipe_kind_id = ?;").all(o.recipe_kind.id)
  // Only fetch recipes in the current locale. Temporary
  // Ideally, locale is a filter, it should be possible to see all. By default only the selected locale.
  o.recipes = db.prepare("SELECT recipes.*, users.name AS user_name FROM recipes JOIN users ON recipes.user_id = users.id WHERE users.locale = ? AND users.is_public = 1 AND recipes.recipe_kind_id = ?;").all(res.locals.locale, o.recipe_kind.id)

  res.locals.gon = o
  res.render('show_recipe_kind');
}, renderApp);

router.get('/u/:id', function(req, res, next) {
  let userId = req.params.id
  let o = {}
  let ids = null
  let attrs = null

  let publicUsers = db.fetchTable('users', {is_public: 1}, ['name'])
  let publicUsersIds = publicUsers.map(u => u.id)
  o.user = publicUsers.find(u => u.id == userId)

  if (!o.user) {throw 'Unable to fetch user. Not existent or not public.'}

  // OPTIMIZE: No need to extract all RECIPE_ATTRS....
  o.recipes = db.fetchTable('recipes', {user_id: userId}, RECIPE_ATTRS)
  o.favorite_recipes = db.fetchTable('favorite_recipes', {user_id: userId}, ['list_id', 'recipe_id'])
  let recipeIds = o.recipes.map(r => r.id)
  let missingRecipeIds = o.favorite_recipes.map(r=>r.recipe_id).filter(id => !recipeIds.includes(id))
  let favRecipes = db.fetchTable('recipes', {id: missingRecipeIds}, RECIPE_ATTRS).filter(r => publicUsersIds.includes(r.user_id))
  o.recipes = [...o.recipes, ...favRecipes]
  o.recipe_kinds = fetchRecipeKinds(db, {}, res.locals.locale, false)

  let slugs1 = o.recipes.map(r=>r.image_slug).filter(x=>x)
  let slugs2 = o.recipe_kinds.map(r=>r.image_slug).filter(x=>x)
  ids = [...slugs1, ...slugs2].map(s => s.split('.')[0])
  attrs = ['author', 'source', 'filename', 'is_user_author', 'slug']
  o.images = db.fetchTable('images', {id: ids}, attrs)

  res.locals.gon = o
  res.render('show_user');
});

router.get('/error', function(req, res, next) {
  return res.render('error');
})

router.get('/contact', function(req, res, next) {
  return res.render('contact');
})

/* GET home page. */
router.get('/', function(req, res, next) {
  // Whether or not to show an HTML cached version while the JS is loading.
  res.locals.disablePreview = req.query.disablePreview
  if (!req.user) {
    // Use this to generate gon, but then use JSON.stringify(gon) and copy paste directly inside home.jsx
    let id = (res.locals.locale != 'fr') ? 773 : 82
    let ids1 = [96, 91, 98, 51];
    let ids2 = [49, 108, 133, 66];
    let recipeKindId = 66
    let recipeKind = fetchRecipeKind(db, {id: recipeKindId}, res.locals.locale)
    let kind_ancestors = null
    if (recipeKind.kind_id) {
      kind_ancestors = fetchKindWithAncestors(db, {id: o.recipe_kind.kind_id}, res.locals.locale)
    }
    res.locals.gon = {
      recipes1: fetchRecipeKinds(db, {id: ids1}, res.locals.locale, false),
      recipes2: fetchRecipeKinds(db, {id: ids2}, res.locals.locale, false),
      recipe: db.fetchRecord('recipes', {id}, RECIPE_ATTRS),
      recipes: db.prepare("SELECT recipes.*, users.name AS user_name FROM recipes JOIN users ON recipes.user_id = users.id WHERE users.locale = ? AND users.is_public = 1 AND recipes.recipe_kind_id = ?;").all(res.locals.locale, recipeKindId),
      kind_ancestors
    }
    return res.render('home');
  }
  if (!req.user.user_id) { return res.redirect(localeHref('/choose_user', req.originalUrl)) }
  next();
}, renderApp)


const ensureAdmin = (req, res, next) => {
  if (req.user.is_admin) {return next()}
  return next('Error account must be an admin.')
}

const renderAdmin = (req, res, next) => {
  res.locals.gon = {
    translations: db.fetchTable('translations', {}, ['from', 'to', 'original', 'translated']),
    recipe_kinds: db.fetchTable('recipe_kinds', {}, ['name_fr', 'json_fr', 'name_en', 'json_en', 'image_slug', 'kind_id']),
    kinds: db.fetchTable('kinds', {}, ['name_fr', 'name_en', 'kind_id']),
    recipes: db.fetchTable('recipes', {}, ['name', 'recipe_kind_id', 'image_slug']),
    stats: {
      nbUsers: db.prepare('SELECT COUNT(*) FROM users').get()['COUNT(*)'],
      nbAccounts: db.prepare('SELECT COUNT(*) FROM accounts').get()['COUNT(*)'],
      public_users: db.fetchTable('users', {is_public: 1}, ['name']),
      nbRequestsTotal: analytics.nbRequestsTotal(),
      nbDailyVisitsTotal: analytics.nbDailyVisitsTotal(),
    },
  }
  res.render('admin')
}

// ADMIN ROUTES
router.get('/admin', ensureAdmin, renderAdmin)
router.get('/admin/:page', ensureAdmin, renderAdmin)
router.get('/admin/:page/:id', ensureAdmin, renderAdmin)
router.post('/backup_db', ensureAdmin, function(req, res, next) {
  db.doBackup()
  res.send('Database backup successful.')
})
router.post('/translate_recipes', ensureAdmin, function(req, res, next) {
  db.doBackup()
  translateRecipes().then(missings => {
    res.json({missings})
  })
})
router.post('/translate_recipe/:id', ensureAdmin, function(req, res, next) {

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
router.post('/match_recipe_kinds', ensureAdmin, function(req, res, next) {

  let recipeKinds = db.fetchTable('recipe_kinds', {}, ['name_fr', 'name_en'])
  let recipes = db.fetchTable('recipes', {recipe_kind_id: null}, ['name', 'recipe_kind_id', 'user_id'])
  recipes.forEach(recipe => {
    let recipeKind = findRecipeKindForRecipeName(recipe.name, recipeKinds)
    if (recipeKind) {
      console.log('Found recipe kind ', recipeKind.name)
      db.safeUpdateField('recipes', recipe.id, 'recipe_kind_id', recipeKind.id, {user_id: recipe.user_id})
    }
  })
  res.send('Ok done!')
})

router.post('/duplicate_recipe/:id', function(req, res, next) {

  let recipe = db.fetchRecord('recipes', {id: req.params.id}, RECIPE_ATTRS)
  let user = db.fetchRecord('users', {id: recipe.user_id}, ['is_public'])
  if (!user || !user.is_public) {throw "Can't duplicate a recipe by a user who is not public."}
  let newRecipe = {...recipe, original_id: recipe.id}
  delete newRecipe.id;
  newRecipe = db.createRecord('recipes', newRecipe, req.user, {allow_write: ['original_id']})
  res.json(newRecipe)
});

function handleError(err, req, res, next) {
  if (err) { return next(err); }
  return res.redirect('/' + (req.body.filter || ''));
}

export default router;
//module.exports = router;
