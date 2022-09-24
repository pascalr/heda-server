import express from 'express';
import crypto from 'crypto';
import connectEnsureLogin from 'connect-ensure-login'
import { fileURLToPath } from 'url';
import path from 'path';

import db from './db.js';
import gon from './gon.js';
import passport from './passport.js';
import utils from './utils.js';

//import dotenv from 'dotenv';
//import Bucket from "backblaze";
//const bucket = Bucket("heda-bucket-production", {
//  id: process.env.B2_ID,
//  key: process.env.B2_KEY
//});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureLogIn = connectEnsureLogin.ensureLoggedIn;
const ensureLoggedIn = ensureLogIn();
const router = express.Router();

router.get('/login', function(req, res, next) {
  res.render('login');
});

router.get('/choose_user', gon.fetchUsers, function(req, res, next) {
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

/* GET home page. */
router.get('/', function(req, res, next) {
  if (!req.user) { return res.render('home'); }
  next();
}, gon.fetchAll, function(req, res, next) {
  let user = res.locals.users.find(u => u.id == req.user.user_id)

  res.render('index', { user, account: req.user });
});

function handleError(err, req, res, next) {
  if (err) { return next(err); }
  return res.redirect('/' + (req.body.filter || ''));
}

export default router;
//module.exports = router;
