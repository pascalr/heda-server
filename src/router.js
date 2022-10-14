import express from 'express';
import crypto from 'crypto';
import connectEnsureLogin from 'connect-ensure-login'
import { fileURLToPath } from 'url';
import path from 'path';

import { db, ALLOWED_COLUMNS_MOD, ALLOWED_COLUMNS_GET, ALLOWED_TABLES_DESTROY, BEFORE_CREATE } from './db.js';
import gon, {initGon, fetchTable, fetchTableMiddleware} from './gon.js';
import passport from './passport.js';
import utils from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let p = process.env.VOLUME_PATH
let VOLUME_FOLDER = p[0] == '.' ? path.join(__dirname, '..', p) : p
let IMAGE_FOLDER = path.join(VOLUME_FOLDER, 'images')

const ensureLogIn = connectEnsureLogin.ensureLoggedIn;
const ensureLoggedIn = ensureLogIn();
const router = express.Router();

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

  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }

    let file = req.files['file'];
    let ext = file.name.substr(file.name.lastIndexOf('.') + 1);
    if (!['jpg', 'jpeg', 'png'].includes(ext)) {
      return res.status(500).send("Image format not supported. Expected jpg, jpeg or png. Was " + ext);
    }

    let image = {filename: file.name, user_id: req.user.user_id}

    let recordTable = req.body.record_table
    let recordId = req.body.record_id
    let recordField = req.body.record_field

    // TODO: Do a transaction like explained here: https://stackoverflow.com/questions/53299322/transactions-in-node-sqlite3
    // I've already copied the code inside db.js
    // But I can't use runBatchAsync because I need the lastId in the second statement
    // But I could simply use runAsync
    // It's just too complicated for now
    //let statements = [
    //  ['INSERT INTO images (filename, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)',
    //    [image.name, image.user_id, utils.now(), utils.now()]
    //  ],
    //];

    db.transaction(() => {
      let info = db.prepare('INSERT INTO images (filename, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)').run(image.filename, image.user_id, utils.now(), utils.now())
      image.id = info.lastInsertRowid;
      // Use the mv() method to place the file somewhere on your server
      file.mv(path.join(IMAGE_FOLDER, image.id + '.' + ext), function(err) {
        if (err) { return res.status(500).send(err); }

        let idOrSlug = recordField == 'image_id' ? image.id : `${image.id}.${ext}`
        console.log('recordField', recordField)
        console.log('idOrSlug', idOrSlug)
        let q = "UPDATE "+db.safe(recordTable, ['recipes', 'tags', 'users'])+" SET "+db.safe(recordField, ['image_id', 'image_slug'])+" = ?, updated_at = ? WHERE id = ?"
        let args = []
        if (recordTable == 'users') {
          args = [idOrSlug, utils.now(), req.user.user_id]
        } else {
          q += " AND user_id = ?"
          args = [idOrSlug, utils.now(), recordId, req.user.user_id]
        }
        db.prepare(q).run(...args)
        res.json(image)
      });
    })()
  } catch(err) { return res.status(500).send(err) }

});

router.post('/create_user', function(req, res, next) {
  if (!req.user.account_id) {return next('Must be logged in to create profile')}
  let info = db.prepare('INSERT INTO users (name, account_id, created_at, updated_at) VALUES (?, ?, ?, ?)').run(req.body.name, req.user.account_id, utils.now(), utils.now())
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

router.post('/login/password', passport.authenticate('local', {
  successReturnToOrRedirect: '/choose_user',
  failureRedirect: '/login',
  failureMessage: true
}));

router.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

router.get('/signup', function(req, res, next) {
  res.render('signup');
});

function setProfile(req, res, next) {
  if (!res.locals.users) next('Error set profile must be called after fetching profiles')
  let user = res.locals.users.find(u => u.id == req.user.user_id)
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
    const info = db.prepare('INSERT INTO accounts (email, encrypted_password, salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(req.body.email, hashedPassword, salt, utils.now(), utils.now())
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
    let info = db.prepare('UPDATE accounts SET encrypted_password = ?, salt = ?, updated_at = ? WHERE reset_password_token = ?').run(hashedPassword, salt, utils.now(), req.body.token)
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

  var fileName = parseInt(req.params.slug.split('.')[0]).toString()+'.'+ext;
  res.sendFile(fileName, {root: IMAGE_FOLDER}, function (err) {
    if (err) { return next(err); }
    console.log('Sent:', fileName);
  });
});

// Deprecated. Use slug instead.
router.get('/images/:id/:variant', function(req, res, next) {

  // TODO: Send only variants, not original
  var fileName = parseInt(req.params.id).toString()+'.jpg';
  res.sendFile(fileName, {root: IMAGE_FOLDER}, function (err) {
    if (err) { return next(err); }
    console.log('Sent:', fileName);
  });
});

//function mapClassNameToTable(className) {
//  switch(className) {
//    case 'recipe': return 'recipes'; break;
//    case 'user': return 'users'; break;
//    case 'favorite_recipe': return 'favorite_recipes'; break;
//    default:
//      throw "Missing table for className " + className
//  }
//}


router.post('/create_record/:table', function(req, res, next) {
  
  try {
    console.log('body', req.body)
    let safeTable = db.safe(req.params.table, Object.keys(ALLOWED_COLUMNS_MOD))
    let fieldsSent = utils.ensureIsArray(req.body['fields[]'])//.filter(f => f != 'table_name')
    let obj = fieldsSent.reduce((acc, f) => ({ ...acc, [f]: req.body['record['+f+']']}), {}) 
    obj.user_id = req.user.user_id

    function updateObj(obj) {
      let fields = Object.keys(obj)
      let values = Object.values(obj)
      let columns = ALLOWED_COLUMNS_MOD[safeTable]
      let query = 'INSERT INTO '+safeTable+' (created_at,updated_at,'+fields.map(f => db.safe(f, [...columns, 'user_id'])).join(',')+') '
      query += 'VALUES (?,?,'+fields.map(f=>'?').join(',')+')'
      let args = [utils.now(), utils.now(), ...values]
      let info = db.prepare(query).run(...args)
      res.json({...obj, id: info.lastInsertRowId})
    }

    if (BEFORE_CREATE[safeTable]) {
      BEFORE_CREATE[safeTable](obj, updateObj)
    } else {
      updateObj(obj)
    }
  } catch(err) {
    throw new Error(err)
  }
})

router.patch('/change_recipe_owner', gon.fetchAccountUsers, function(req, res, next) {
  try {
    let recipeId = req.body.recipeId
    let newOwnerId = req.body.newOwnerId
    if (!res.locals.users.map(u => u.id.toString()).includes(newOwnerId)) {
      throw new Error("ChangeRecipeOwner not allowed")
    }
    let recipe = db.prepare('SELECT id, user_id FROM recipes WHERE id = ?').get(recipeId)
    if (!res.locals.users.map(u => u.id).includes(recipe.user_id)) {
      throw new Error("ChangeRecipeOwner not allowed")
    }
    let query = 'UPDATE recipes SET user_id = ?, updated_at = ? WHERE id = ?'
    let args = [newOwnerId, utils.now(), recipeId]
    console.log('query', query)
    console.log('args', args)
    db.prepare(query).run(args)
    res.json({status: 'ok'})
    
  } catch(err) {
    throw new Error(err)
  }
});

router.patch('/update_field/:table/:id', function(req, res, next) {

  try {
    let {table, id} = req.params
    let {field, value} = req.body

    let info = null
    if (table == 'users') {
      info = db.updateField(table, req.user.user_id, field, value, null)
    } else {
      info = db.updateField(table, id, field, value, {user_id: req.user.user_id})
    }
    res.json({status: 'ok'})
  } catch(err) {
    throw new Error(err)
  }
});

router.get('/fetch_record/:table/:id', function(req, res, next) {

  try {
    let id = req.params.id
    let table = req.params.table
    if (Object.keys(ALLOWED_COLUMNS_GET).includes(table)) {
      //fetchTable(table, {id: id, user_id: req.user.user_id}, ALLOWED_COLUMNS_GET[table], next, (records) => {
      fetchTableMiddleware(table, {id: id}, ALLOWED_COLUMNS_GET[table], next, (records) => {
        res.json({...records[0]})
      })
    } else {
      throw new Error("FetchRecord not allowed")
    }
  } catch(err) {
    throw new Error(err)
  }
});

// TODO: Do all the modifications inside a single transaction, and rollback if there is an error.
router.patch('/batch_modify', function(req, res, next) {

  try {
    let mods = JSON.parse(req.body.mods)
    let applyMods = db.transaction((mods) => {
      mods.forEach(({method, tableName, id, field, value}) => {
        if (method == 'UPDATE') {
          let info = db.updateField(tableName, id, field, value, {user_id: req.user.user_id})
        }
      })
    })
    applyMods(mods)
    res.json({status: 'ok'})
  } catch(err) {
    throw new Error(err)
  }
});

router.delete('/destroy_record/:table/:id', function(req, res, next) {

  try {
    let id = req.params.id
    let table = req.params.table
    let query = ''
    let args = []
    query = 'DELETE FROM '+db.safe(table, ALLOWED_TABLES_DESTROY)+' WHERE id = ? AND user_id = ?'
    db.prepare(query).run([id, req.user.user_id])
    res.json({status: 'ok'})
  } catch(err) {
    throw new Error(err)
  }
});

/* GET home page. */
router.get('/', function(req, res, next) {
  if (!req.user) { return res.render('home'); }
  if (!req.user.user_id) { return res.redirect('/choose_user'); }
  next();
}, gon.fetchAll, setProfile, function(req, res, next) {
  res.render('index', { account: req.user });
});

function handleError(err, req, res, next) {
  if (err) { return next(err); }
  return res.redirect('/' + (req.body.filter || ''));
}

export default router;
//module.exports = router;
