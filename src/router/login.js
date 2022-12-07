
import express from 'express';
import crypto, { randomInt } from 'crypto';
import sendgrid from '@sendgrid/mail';
import connectEnsureLogin from 'connect-ensure-login'

import passport from '../passport.js';
import { normalizeSearchText, localeHref, now, shuffle } from '../utils.js';
import { db } from '../db.js';
import { validateEmail, validatePassword, validateUsername, fetchTableLocaleAttrs } from '../lib.js'
import { tr } from '../translate.js'

const router = express.Router();

sendgrid.setApiKey(process.env['SENDGRID_API_KEY']);

export const ensureLoggedIn = function(req, res, next) {
  if (req.user && req.user.account_id) {return next()}
  res.redirect('/')
  //next("Error the account is not logged in...")
}
export const ensureUser = function(req, res, next) {
  if (req.user && req.user.user_id) {return next()}
  res.redirect('/login')
  //next("Error the account is not logged in or the user is not selected...")
}

function initGon(req, res, next) {
  res.locals.gon = {}; next()
}

function fetchAccountUsers(req, res, next) {
  let attrs = ['name', 'gender', 'image_slug', 'locale']
  res.locals.users = db.fetchTable('users', {account_id: req.user.account_id}, attrs)
  if (res.locals.gon) {res.locals.gon.users = res.locals.users}
  next()
}

function redirectHomeIfLoggedIn(req, res, next) {
  if (req.user && req.user.user_id) {
    res.redirect('/');
  } else {
    next()
  }
}

router.get('/login', redirectHomeIfLoggedIn, function(req, res, next) {
  res.locals.email_just_validated = req.query.email_just_validated
  res.render('login');
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

router.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect(localeHref('/', req.originalUrl));
  });
});


router.get('/choose_user', redirectHomeIfLoggedIn, fetchAccountUsers, function(req, res, next) {
  res.render('choose_user');
});

router.get('/new_user', function(req, res, next) {
  if (req.query.err) {res.locals.error = tr(req.query.err, res.locals.locale)}
  res.render('new_profile');
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

export function setProfile(req, res, next) {
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

router.get('/waiting_confirm', redirectHomeIfLoggedIn, function(req, res, next) {
  res.render('waiting_confirm')
})

router.get('/confirm_signup', function(req, res, next) {
  const user = db.fetchRecord('users', {email_confirmation_token: req.query.token}, ['email', 'email_validated'])
  if (user) {
    if (!user.email_validated) {
      user.findAndUpdateRecord('users', user, {email_validated: 1}, req.user)
    }
    res.redirect('/login?msg=email_just_validated=1') // TODO: Add messages. Add message to user that it the user has been validated. They can now log in.
  } else {
    res.redirect('/signup') // TODO: Add error message
  }
})

function captchaQuestion(req, locale) {
  if (!req.session.captchaAttempts) {
    req.session.captchaAttempts = 1
  } else if (req.session.captchaAttempts >= 5) {
    if (req.session.captchaBanDate) {
      // Reset attempts after 5 minutes
      if (Date.now() - req.session.captchaBanDate >= 5*60*1000) {
        req.session.captchaAttempts = 1
        req.session.captchaBanDate = null
      } else {
        return {error: tr('Maximum_limit_reached', locale)+'. '+tr('Please_try_again_later', locale)}
      }
    } else {
      req.session.captchaBanDate = Date.now()
      return {error: tr('Maximum_limit_reached', locale)+'. '+tr('Please_try_again_later', locale)}
    }
  } else {
    req.session.captchaAttempts += 1
  }
  console.log('Captcha attempt: ', req.session.captchaAttempts)
  let recipeKinds = fetchTableLocaleAttrs(db, 'recipe_kinds', {}, ['image_slug'], ['name'], locale).filter(k => k.image_slug && k.name)
  let choices = shuffle(recipeKinds).slice(0, 9)
  let correctIdx = randomInt(9)
  req.session.captcha = choices[correctIdx].id
  let question = tr('Please_select', locale)+': <b>'+choices[correctIdx].name+'</b>?'
  return {choices, question}
}
router.get('/fetch_captcha', function(req, res, next) {
  res.json(captchaQuestion(req, res.locals.locale));
})
router.post('/validate_captcha', function(req, res, next) {

  let validated = req.body.captcha == req.session.captcha
  if (validated) {
    console.log('Captcha validated!')
    req.session.captchaValidatedAt = Date.now()
  }
  res.json(validated ? {validated} : captchaQuestion(req, res.locals.locale))
})

router.get('/signup', function(req, res, next) {
  let gon = {errors: req.flash('error')}
  console.log('captchaValidatedAt', req.session.captchaValidatedAt)
  if (req.session.captchaValidatedAt && (Date.now() - req.session.captchaValidatedAt < 3*60*1000)) {
    gon.captchaAlreadyValidated = true
  }
  res.render('signup', {gon});
});

/**
 * Create a user with the given email. Store salt and encrypted password. Store token for email validation.
 * 
 * Send an email in order to validate the user. Don't log the user in yet.
 */
router.post('/signup', function(req, res, next) {

  let {email, username, password} = req.body

  let allUsers = db.fetchTable('users', {}, ['name', 'email'])

  function validateUnique(value, values, error) {
    let val = normalizeSearchText(value)
    return values.find(v => normalizeSearchText(v) == val) ? error : ''
  }

  if (!req.session.captchaValidatedAt || (Date.now() - req.session.captchaValidatedAt >= 5*60*1000)) {
    req.flash('error', tr('Invalid_captcha', res.locals.locale))
    return res.redirect(localeHref('/signup', req.originalUrl));
  }

  let errors = [
    validateEmail(email),
    validateUsername(username),
    validatePassword(password),
    validateUnique(email, allUsers.map(u=>u.email), 'Email_not_unique'),
    validateUnique(username, allUsers.map(u=>u.name), 'Username_not_unique')
  ].filter(f => f)

  if (errors.length === 0) {

    var salt = crypto.randomBytes(16);
    crypto.pbkdf2(password, salt, 310000, 32, 'sha256', function(err, hashedPassword) {
      if (err) { return next(err); }
      try {
        var token = crypto.randomUUID();
        let q = 'INSERT INTO users (email, name, confirm_email_token, encrypted_password, salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        // let info = db.prepare(q).run(email, username, token, hashedPassword, salt, now(), now())
        // if (info.changes != 1) {throw "Error creating user in database."}
        var link = res.locals.origin+'/confirm_signup?token=' + token;
        var msg = {
          to: email,
          from: 'admin@hedacuisine.com',
          subject: 'Sign in to HedaCuisine',
          text: 'Hello! Click the link below to finish signing in to HedaCuisine.\r\n\r\n' + link,
          html: '<h3>Hello!</h3><p>Click the link below to finish signing in to HedaCuisine.</p><p><a href="' + link + '">Sign in</a></p>',
        };
        console.log('User created!')
        console.log('User created!')
        console.log('User created!')
        res.send('ok')
        // sendgrid.send(msg);
        // res.redirect('/waiting_confirm')
      } catch (err) {
        console.log('CREATE USER ERROR:', err)
        if (err.code && err.code === "SQLITE_CONSTRAINT_UNIQUE") { // SqliteError
          req.flash('error', tr('Account_already_associated', res.locals.locale))
          res.redirect(localeHref('/signup', req.originalUrl));
        }
      }
    })
  } else {
    req.flash('error', errors.map(e => tr(e, res.locals.locale)).join('. '))
    res.redirect(localeHref('/signup', req.originalUrl));
  }
});

export default router;