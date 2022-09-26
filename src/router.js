import express from 'express';
import crypto from 'crypto';
import connectEnsureLogin from 'connect-ensure-login'
import { fileURLToPath } from 'url';
import path from 'path';

import db from './db.js';
import gon, {initGon} from './gon.js';
import passport from './passport.js';
import utils from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureLogIn = connectEnsureLogin.ensureLoggedIn;
const ensureLoggedIn = ensureLogIn();
const router = express.Router();

router.get('/login', function(req, res, next) {
  res.render('login');
});

router.get('/choose_user', gon.fetchAccountUsers, function(req, res, next) {
  res.render('choose_user');
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

router.get('/edit_profile', initGon, gon.fetchAccountUsers, function(req, res, next) {
  let user = res.locals.users.find(u => u.id == req.user.user_id)
  res.locals.gon.user = user
  res.locals.user = user
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
    db.run('INSERT INTO accounts (email, encrypted_password, salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [
      req.body.email, hashedPassword, salt, utils.now(), utils.now() 
    ], function(err) {
      if (err) { return next(err); }
      var user = {
        account_id: this.lastID,
        email: req.body.email
      };
      req.login(user, function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
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
    db.run('UPDATE accounts SET encrypted_password = ?, salt = ?, updated_at = ? WHERE reset_password_token = ?', [
        hashedPassword, salt, utils.now(), req.body.token
      ], function(err) {
        if (err) { return next(err); }
        var user = {
          id: this.lastID,
          username: req.body.username
        };
        req.login(user, function(err) {
          if (err) { return next(err); }
          res.redirect('/');
        });
      }
    );
  });
});

router.get('/images/:id/:variant', function(req, res, next) {

  // TODO: Send only variants, not original
  var fileName = req.params.id+'.jpg';
  res.sendFile(fileName, {root: path.join(__dirname, '../public/images/')}, function (err) {
      if (err) {
          next(err);
      } else {
          console.log('Sent:', fileName);
      }
  });
});

function mapClassNameToTable(className) {
  switch(className) {
    case 'recipe': return 'recipes'; break;
    case 'user': return 'users'; break;
    case 'favorite_recipe': return 'favorite_recipes'; break;
    default:
      throw "Missing table for className " + className
  }
}

const ALLOWED_COLUMNS = {
  'recipes': ['name', 'main_ingredient_id', 'preparation_time', 'cooking_time', 'total_time', 'json', 'use_personalised_image', 'image_id'],
  'users': ['name', 'gender'],
  'favorite_recipes': ['list_id', 'recipe_id']
}
const ALLOWED_TABLES = Object.keys(ALLOWED_COLUMNS)
const ALLOWED_TABLES_DESTROY = ['favorite_recipes']

router.post('/create_record/:className', function(req, res, next) {
  
  try {
    console.log('body', req.body)
    let className = req.params.className
    let table = mapClassNameToTable(className)
    let fields = req.body['fields[]'].filter(f => f != 'class_name')
    if (!ALLOWED_TABLES.includes(table)) {
      throw new Error("CreateRecord table not allowed")
    }
    fields.forEach(field => {
      if (!ALLOWED_COLUMNS[table].includes(field)) {
        throw new Error("CreateRecord column not allowed. Field: "+field)
      }
    })
    let query = 'INSERT INTO '+table+' (user_id,created_at,updated_at,'+fields.join(',')+') '
    query += 'VALUES (?,?,?,'+fields.map(f=>'?').join(',')+')'
    let values = fields.map(f => req.body['record['+f+']'])
    let args = [req.user.user_id, utils.now(), utils.now(), ...values]
    db.run(query, args, function(err) {
      if (err) { return next(err); }
      let o = fields.reduce((acc, f) => ({ ...acc, [f]: req.body['record['+f+']']}), {}) 
      res.json({...o, id: this.lastID, class_name: className})
    })
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
    db.each('SELECT id, user_id FROM recipes WHERE id = ?', recipeId, function(err, recipe) {
      if (err) {return next(err);}
      if (!res.locals.users.map(u => u.id).includes(recipe.user_id)) {
        throw new Error("ChangeRecipeOwner not allowed")
      }
      let query = 'UPDATE recipes SET user_id = ?, updated_at = ? WHERE id = ?'
      let args = [newOwnerId, utils.now(), recipeId]
      console.log('query', query)
      console.log('args', args)
      db.run(query, args, function(err) {
        if (err) { return next(err); }
        res.json({status: 'ok'})
      })
    })
  } catch(err) {
    throw new Error(err)
  }
});

router.patch('/update_field/:className/:id', function(req, res, next) {

  try {
    let id = req.params.id
    let className = req.params.className
    let table = mapClassNameToTable(className)
    let field = req.body.field
    let value = req.body.value
    if (ALLOWED_TABLES.includes(table) && ALLOWED_COLUMNS[table].includes(field)) {
      let query = ''
      let args = []
      if (table == 'users') {
        query = 'UPDATE '+table+' SET '+field+' = ?, updated_at = ? WHERE id = ?'
        args = [value, utils.now(), req.user.user_id]
      } else {
        query = 'UPDATE '+table+' SET '+field+' = ?, updated_at = ? WHERE id = ? AND user_id = ?'
        args = [value, utils.now(), id, req.user.user_id]
      }
      db.run(query, args, function(err) {
        if (err) { return next(err); }
        res.json({status: 'ok'})
      })
    } else {
      throw new Error("UpdateField not allowed")
    }
  } catch(err) {
    throw new Error(err)
  }
});

router.delete('/destroy_record/:className/:id', function(req, res, next) {

  try {
    let id = req.params.id
    let className = req.params.className
    let table = mapClassNameToTable(className)
    if (ALLOWED_TABLES_DESTROY.includes(table)) {
      let query = ''
      let args = []
      query = 'DELETE FROM '+table+' WHERE id = ? AND user_id = ?'
      args = [id, req.user.user_id]
      db.run(query, args, function(err) {
        if (err) { return next(err); }
        res.json({status: 'ok'})
      })
    } else {
      throw new Error("DestroyRecord not allowed")
    }
  } catch(err) {
    throw new Error(err)
  }
});

/* GET home page. */
router.get('/', function(req, res, next) {
  if (!req.user) { return res.render('home'); }
  next();
}, gon.fetchAll, function(req, res, next) {
  let user = res.locals.users.find(u => u.id == req.user.user_id)
  res.locals.gon.user = user
  res.render('index', { user, account: req.user });
});

function handleError(err, req, res, next) {
  if (err) { return next(err); }
  return res.redirect('/' + (req.body.filter || ''));
}

export default router;
//module.exports = router;
