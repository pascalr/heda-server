var express = require('express');
var crypto = require('crypto');
var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;

var db = require('./db');
var passport = require('./passport');
var utils = require('./utils');

var ensureLoggedIn = ensureLogIn();
var router = express.Router();

router.get('/login', function(req, res, next) {
  res.render('login');
});

router.get('/choose_user', fetchUsers, function(req, res, next) {
  res.render('choose_user');
});

router.post('/choose_user', function(req, res, next) {
  console.log(req.body.user_id)
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
      req.body.username, hashedPassword, salt, utils.now(), utils.now() 
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
  //db.get('SELECT * FROM users WHERE token = ?', [ req.body.token ], function(err, row) {
  //  if (err) { return cb(err); }
  //  if (!row) { return cb(null, false, { message: 'Incorrect username or password.' }); }
  // 
  //  console.log('password: ', password)
  //  console.log('salt: ', row.salt)
  //  crypto.pbkdf2(password, row.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
  //    console.log('hashed: ', hashedPassword)
  //    console.log('encrypted: ', row.encrypted_password)
  //    var buf = typeof row.encrypted_password === 'string' ? Buffer.from(row.encrypted_password, 'utf8') : row.encrypted_password
  //    console.log('buf: ', buf)
  //    console.log('heeeeeeeeeeeeeeeeerrrrrrrrrrrrrrrrrrrrrreeeeeeeeeeeeeeeeeeeeeeee')
  //    if (err) { return cb(err); }
  //    if (!crypto.timingSafeEqual(buf, hashedPassword)) {
  //      return cb(null, false, { message: 'Incorrect username or password.' });
  //    }
  //    return cb(null, row);
  //  });
  //});
  //users.reset(req, res, function (err) {
  //  if (err) {
  //    req.flash('error', err);
  //    return res.redirect('/reset');
  //  }
  //  else {
  //    req.flash('success', 'Password successfully reset.  Please login using new password.');
  //    return res.redirect('/login');
  //  }
  //});
});

function fetchUsers(req, res, next) {
  db.all('SELECT * FROM users WHERE account_id = ?', [
    req.user.id
  ], function(err, rows) {
    if (err) { return next(err); }

    var users = rows.map(function(row) {
      return {
        id: row.id,
        email: row.email,
        name: row.name
      }
    })
    res.locals.users = users;
    next();
  })
}

function fetchRecipes(req, res, next) {
  db.all('SELECT * FROM recipes WHERE user_id = ?', [
    req.user.id
  ], function(err, rows) {
    if (err) { return next(err); }

    var recipes = rows.map(function(row) {
      return {
        id: row.id,
        name: row.name
      }
    })
    res.locals.recipes = recipes;
    next();
  })

}

/* GET home page. */
router.get('/', function(req, res, next) {
  if (!req.user) { return res.render('home'); }
  next();
}, fetchRecipes, function(req, res, next) {
  res.locals.filter = null;
  res.render('index', { user: req.user });
});

function handleError(err, req, res, next) {
  if (err) { return next(err); }
  return res.redirect('/' + (req.body.filter || ''));
}

module.exports = router;
