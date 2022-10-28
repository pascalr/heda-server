import express from 'express';
import crypto from 'crypto';
import connectEnsureLogin from 'connect-ensure-login'
import { fileURLToPath } from 'url';
import sharp from 'sharp'
import path from 'path';

import { db, ALLOWED_COLUMNS_GET } from './db.js';
import gon, {initGon, fetchTableMiddleware, RECIPE_ATTRS} from './gon.js';
import passport from './passport.js';
import { localeHref, now, ensureIsArray } from './utils.js';
import { tr } from './translate.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let p = process.env.VOLUME_PATH
let VOLUME_FOLDER = p[0] == '.' ? path.join(__dirname, '..', p) : p
let IMAGE_FOLDER = path.join(VOLUME_FOLDER, 'images')

const ensureLogIn = connectEnsureLogin.ensureLoggedIn;
const ensureLoggedIn = ensureLogIn();
const router = express.Router();

router.get('/search', function(req, res, next) {
  let query = req.query.q
  let tokens = query.replace(' ', '%')

  // TODO: Create another field for recipes called name_search, where it is in lowercase and where there are no accents
  let recipes = db.prepare("SELECT recipes.id, recipes.name, recipes.image_slug, users.name AS user_name FROM recipes JOIN users ON recipes.user_id = users.id WHERE users.is_public = 1 AND recipes.name LIKE '%"+tokens+"%' COLLATE NOCASE LIMIT 30;").all()
  
  let users = db.prepare("SELECT id, name, image_slug FROM users WHERE is_public = 1 AND name LIKE '%"+tokens+"%' COLLATE NOCASE LIMIT 30;").all()

  res.json({query, results: {recipes, users}})
});

router.get('/login', function(req, res, next) {
  res.render('login');
});

router.get('/choose_user', gon.fetchAccountUsers, function(req, res, next) {
  res.render('choose_user');
});

router.get('/new_user', function(req, res, next) {
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
    return res.status(500).json({publicError: tr('Image_format_not_supported') + ext});
  }

  let {record_table, record_id, record_field} = req.body

  db.transaction(() => {

    let lastId = db.prepare('SELECT MAX(id) from images').get()['MAX(id)']
    let slug = `${lastId+1}.${ext}`
    let image = {filename: file.name, slug}
    image = db.createRecord('images', image, req.user.user_id, {allow_write: ['slug']})
    if (image.id != lastId +1) {throw "Database invalid state for images."}
    db.safeUpdateField(record_table, record_id, record_field, slug, req.user)

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
  if (!req.user.account_id) {return next('Must be logged in to create profile')}
  let info = db.prepare('INSERT INTO users (name, account_id, created_at, updated_at) VALUES (?, ?, ?, ?)').run(req.body.name, req.user.account_id, now(), now())
  req.user.user_id = info.lastInsertRowid;
  res.redirect('/');
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
  console.log('********************************')
  console.log('1', req.originalUrl)
  console.log('2', localeHref('/choose_user', req.originalUrl))
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

router.get('/signup', function(req, res, next) {
  res.render('signup');
});

function setProfile(req, res, next) {
  if (!res.locals.gon.users) next('Error set profile must be called after fetching profiles')
  let user = res.locals.gon.users.find(u => u.id == req.user.user_id)
  if (!user) {req.user.user_id = null; next('Error profile not found')}
  res.locals.gon.user = user
  res.locals.user = user
  next()
}

router.get('/edit_profile', initGon, gon.fetchAccountUsers, gon.fetchUserImages, setProfile, function(req, res, next) {
  res.render('edit_profile');
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
    const info = db.prepare('INSERT INTO accounts (email, encrypted_password, salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(req.body.email, hashedPassword, salt, now(), now())
    var user = {
      account_id: info.lastInsertRowid,
      email: req.body.email
    };
    req.login(user, function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
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
    return res.status(500).send("Image variant not supported. Expected medium, thumb or original. Was " + variant);
  }


  var fileName = parseInt(req.params.slug.split('.')[0]).toString()+'.'+ext;
  res.sendFile(fileName, {root: path.join(IMAGE_FOLDER, variant)}, function (err) {
    if (err) { return next(err); }
    console.log('Sent:', fileName);
  });
});

router.post('/create_record/:table', function(req, res, next) {
  
  let record = db.createRecord(req.params.table, req.body.record, req.user.user_id)
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

router.patch('/update_field/:table/:id', function(req, res, next) {

  let {table, id} = req.params
  let {field, value} = req.body

  console.log('req.body', req.body)

  let info = db.safeUpdateField(table, id, field, value, req.user)
  if (info.changes != 1) {return res.status(500).send("Unable to update record in database")}
  res.json({status: 'ok'})
});

router.get('/fetch_record/:table/:id', function(req, res, next) {

  let id = req.params.id
  let table = req.params.table
  if (Object.keys(ALLOWED_COLUMNS_GET).includes(table)) {
    //fetchTable(table, {id: id, user_id: req.user.user_id}, ALLOWED_COLUMNS_GET[table], next, (records) => {
    // FIXME: fetchRecord and not fetchTable...
    const records = db.fetchTable(table, {id: id}, ALLOWED_COLUMNS_GET[table])
    res.json({...records[0]})
  } else {
    throw new Error("FetchRecord not allowed")
  }
});

// TODO: Do all the modifications inside a single transaction, and rollback if there is an error.
router.patch('/batch_modify', function(req, res, next) {

  let mods = JSON.parse(req.body.mods)
  let applyMods = db.transaction((mods) => {
    mods.forEach(({method, tableName, id, field, value}) => {
      if (method == 'UPDATE') {
        let info = db.safeUpdateField(tableName, id, field, value, {user_id: req.user.user_id})
        if (info.changes != 1) {throw "Unable to update record in database"}
      }
    })
  })
  applyMods(mods)
  res.json({status: 'ok'})
});

router.delete('/destroy_record/:table/:id', function(req, res, next) {

  let {id, table} = req.params
  db.destroyRecordWithDependants(table, id, req.user)
  //db.safeDestroyRecord(table, id, req.user)
  res.json({status: 'ok'})
});

router.get('/demo', function(req, res, next) {
  next()
});

router.get('/r/:id', function(req, res, next) {

  let recipeId = req.params.id
  let o = {}
  let ids = null
  let attrs = null
  // FIXME: Create and use fetchRecord or findRecord, not fetchTable
  o.recipe = db.fetchTable('recipes', {id: recipeId}, RECIPE_ATTRS)[0]
  if (!o.recipe) {throw 'Unable to fetch recipe. Not existent.'}
  // FIXME: Create and use fetchRecord or findRecord, not fetchTable
  o.user = db.fetchTable('users', {id: o.recipe.user_id, is_public: 1}, ['name'])[0]
  if (!o.user) {throw 'Unable to fetch recipe. No permission by user.'}

  //if (o.recipe.recipe_kind_id) {
  //  let attrs = ['name', 'description_json', 'image_slug']
  //  // FIXME: Create and use fetchRecord or findRecord, not fetchTable
  //  o.recipe_kind = db.fetchTable('recipe_kinds', {id: o.recipe.recipe_kind_id}, attrs)[0]
  //}

  let slugs = [o.recipe.image_slug, o.recipe_kind ? o.recipe_kind.image_slug : null].filter(x=>x)
  ids = slugs.map(s => s.split('.')[0])
  attrs = ['author', 'source', 'filename', 'is_user_author', 'slug']
  o.images = db.fetchTable('images', {id: ids}, attrs)

  res.locals.gon = o
  res.render('show_recipe');
});

router.get('/u/:id', function(req, res, next) {
  let userId = req.params.id
  let o = {}
  let ids = null
  let attrs = null

  let publicUsers = db.fetchTable('users', {is_public: 1}, ['name'])
  let publicUsersIds = publicUsers.map(u => u.id)
  o.user = publicUsers.find(u => u.id == userId)

  if (!o.user) {throw 'Unable to fetch user. Not existent or not public.'}

  o.recipes = db.fetchTable('recipes', {user_id: userId}, RECIPE_ATTRS)
  o.favorite_recipes = db.fetchTable('favorite_recipes', {user_id: userId}, ['list_id', 'recipe_id'])
  let recipeIds = o.recipes.map(r => r.id)
  let missingRecipeIds = o.favorite_recipes.map(r=>r.recipe_id).filter(id => !recipeIds.includes(id))
  let favRecipes = db.fetchTable('recipes', {id: missingRecipeIds}, RECIPE_ATTRS).filter(r => publicUsersIds.includes(r.user_id))
  o.recipes = [...o.recipes, ...favRecipes]
  o.recipe_kinds = db.fetchTable('recipe_kinds', {}, ['name', 'description_json', 'image_slug'])

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

/* GET home page. */
router.get('/', function(req, res, next) {
  if (!req.user) {
    //// Use this to generate gon, but then use JSON.stringify(gon) and copy paste directly inside home.jsx
    //res.locals.gon = {
    //  locale: res.locals.locale,
    //  recipes1: db.fetchTable('recipes', {id: [113, 129, 669, 88, 323, 670, 672, 689]}, ['name', 'image_slug']),
    //  recipes2: db.fetchTable('recipes', {id: [755, 757, 66, 558]}, ['name', 'image_slug']),
    //  recipe: db.fetchTable('recipes', {id: 82}, RECIPE_ATTRS)[0] // FIXME: Should be fetchRecord
    //}
    return res.render('home');
  }
  if (!req.user.user_id) { return res.redirect('/choose_user'); }
  next();
}, gon.fetchAll, setProfile, function(req, res, next) {
  res.render('index', { account: req.user });
});


const ensureAdmin = (req, res, next) => {
  if (req.user.is_admin) {return next()}
  return next('Error account must be an admin.')
}

// ADMIN ROUTES
router.get('/admin', ensureAdmin, function(req, res, next) {
  res.render('admin')
})

router.post('/backup_db', ensureAdmin, function(req, res, next) {
  db.doBackup()
  res.send('Database backup successful.')
})

function handleError(err, req, res, next) {
  if (err) { return next(err); }
  return res.redirect('/' + (req.body.filter || ''));
}

export default router;
//module.exports = router;
