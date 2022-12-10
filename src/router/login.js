
import express from 'express';
import crypto, { randomInt } from 'crypto';
import sendgrid from '@sendgrid/mail';
// import connectEnsureLogin from 'connect-ensure-login'
import _ from 'lodash'

// import passport from '../passport.js';
import { normalizeSearchText, localeHref, now, shuffle, isValidEmail } from '../utils.js';
import { db } from '../db.js';
import { validateEmail, validatePassword, validateUsername, fetchTableLocaleAttrs } from '../lib.js'
import { tr, translate } from '../translate.js'

const router = express.Router();

sendgrid.setApiKey(process.env['SENDGRID_API_KEY']);

export const ensureLoggedIn = function(req, res, next) {
  if (req.user) {return next()}
  res.redirect('/')
  //next("Error the account is not logged in...")
}
export const ensureUser = function(req, res, next) {
  if (req.user && req.user.user_id) {return next()}
  res.redirect('/login')
  //next("Error the account is not logged in or the user is not selected...")
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

const USER_ATTRS = ['name', 'locale', 'account_id', 'admin']
async function loginUser(user, req, res, next) {
  req.session.user = _.pick(user, ['name', 'id', 'locale', 'account_id'])
  req.session.user.user_id = user.id
  req.session.user.is_admin = user.admin
  res.redirect('/')
}

function findUserByNameOrEmail(nameOrEmail, attrs) {
  let cond = isValidEmail(nameOrEmail) ? {email: nameOrEmail} : {username: nameOrEmail}
  return db.fetchRecord('users', cond, attrs)
}

router.post('/login/password', function(req, res, next) {

  let {username, password} = req.body
  const user = findUserByNameOrEmail(username, ['salt', 'encrypted_password', ...USER_ATTRS])

  function invalidLogin() {
    req.flash('error', tr('Invalid_login', res.locals.locale))
    res.redirect('/login')
  }
  if (!user) {return invalidLogin()}
  
  crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
    if (err) { return next(err); }
    if (!crypto.timingSafeEqual(user.encrypted_password, hashedPassword)) {
      return invalidLogin()
    }
    loginUser(user, req, res, next)
  });
  // passport.authenticate('local', {
  //   successReturnToOrRedirect: localeHref('/choose_user', req.originalUrl),
  //   failureRedirect: '/login',
  //   failureMessage: true
  // })(req, res, next);
});

router.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect(localeHref('/', req.originalUrl));
  });
});

// ALL THESE ROUTES WHERE BECAUSE I WAS DOING A LOGIN LIKE NETFLIX.
// YOU ENTER AN EMAIL, THEN SELECT A PROFILE.
// BUT I AM NOT DOING THAT ANYMORE.
// function fetchAccountUsers(req, res, next) {
//   let attrs = ['name', 'image_slug', 'locale']
//   res.locals.users = db.fetchTable('users', {account_id: req.user.account_id}, attrs)
//   if (res.locals.gon) {res.locals.gon.users = res.locals.users}
//   next()
// }
// router.get('/choose_user', redirectHomeIfLoggedIn, fetchAccountUsers, function(req, res, next) {
//   res.render('choose_user');
// });
// router.get('/new_user', function(req, res, next) {
//   if (req.query.err) {res.locals.error = tr(req.query.err, res.locals.locale)}
//   res.render('new_profile');
// });
// router.post('/create_user', function(req, res, next) {
//   if (!req.user || !req.user.account_id) {return next('Must be logged in to create profile')}
//   try {
//     let info = db.prepare('INSERT INTO users (name, locale, account_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(req.body.name, req.body.locale, req.user.account_id, now(), now())
//     req.user.user_id = info.lastInsertRowid;
//     res.redirect('/');
//   } catch (err) {
//     res.redirect(localeHref('/new_user?err=Name_already_used', req.originalUrl));
//   }
// });
// router.delete('/destroy_profile/:id', function(req, res, next) {

//   if (!req.user.account_id) {return next('Must be logged in to destroy profile')}
//   let id = req.params.id

//   let query = 'DELETE FROM users WHERE id = ? AND account_id = ?'
//   db.prepare(query).run(id, req.user.account_id)
//   req.user.user_id = null
//   res.json({status: 'ok'})
// });
// router.post('/choose_user', function(req, res, next) {
//   req.user.user_id = req.body.user_id
//   res.redirect('/');
// });
// export function setProfile(req, res, next) {
//   if (!res.locals.gon?.users) next('Error set profile must be called after fetching profiles')
//   let user = res.locals.gon.users.find(u => u.id == req.user.user_id)
//   if (!user) {req.user.user_id = null; next('Error current profile not found in database. Database changed? Logging out of profile...')}
//   res.locals.gon.user = {...user, is_admin: req.user.is_admin}
//   res.locals.user = user
//   next()
// }
// router.get('/edit_account', fetchAccountUsers, function(req, res, next) {
//   res.locals.gon.account = db.fetchRecord('accounts', {id: req.user.account_id}, ['email'])
//   res.render('edit_account');
// });

router.post('/change_user', function(req, res, next) {
  let account_id = req.user.account_id
  if (account_id) {
    let user = db.fetchRecord('users', {account_id, id: req.body.user_id}, USER_ATTRS)
    // Redundant account_id check but it's very important security so why not
    if (user && user.account_id == req.user.account_id) { return loginUser(user, req, res, next) }
  }
  res.redirect('/');
});

router.get('/edit_profile', function(req, res, next) {
  res.render('edit_profile');
});

router.post('/rename_user', ensureLoggedIn, function(req, res, next) {
  let name = req.body.name
  let username = normalizeSearchText(name)
  let err = validateUsername(name)
  if (!err) {
    let info = db.prepare('UPDATE users SET name = ?, username = ? WHERE id = ?').run(name, username, req.user.id)
    if (info.changes != 1) {
      req.flash('error', res.t('Internal_error'))
      res.send({error: res.t('Internal_error')})
    } else {
      req.user.name = name
      res.send('ok')
    }
  } else {
    req.flash('error', res.t(err))
    res.send({error: res.t(err)})
  }
});

router.get('/forgot', redirectHomeIfLoggedIn, function (req, res, next) {
  res.render('forgot');
});

router.post('/forgot', redirectHomeIfLoggedIn, function (req, res, next) {
  
  let t = translate(res.locals.locale)

  const u = findUserByNameOrEmail(req.body.email, ['email'])
  if (!u) {
    req.flash('error', t('Invalid_email_address_or_username'))
    return res.render('forgot')
  }

  var token = crypto.randomUUID();
  let info = db.prepare('UPDATE users SET reset_password_token = ? WHERE id = ?').run(token, u.id)
  if (info.changes != 1) {
    req.flash('error', t('Internal_error'))
    return res.render('forgot')
  }

  var link = res.locals.origin+'/reset/' + token;
  var msg = {
    to: u.email,
    from: 'admin@hedacuisine.com',
    subject: 'HedaCuisine - Reset password',
    text: t('Reset_password_message')+'.\r\n\r\n' + link,
    html: '<p>'+t('Reset_password_message')+'.</p><p><a href="' + link + '">'+t('Reset')+'</a></p>',
  };
  sendgrid.send(msg);
  res.redirect(localeHref('/waiting_reset', req.originalUrl))

});

router.get('/reset/:token', redirectHomeIfLoggedIn, function (req, res, next) {
  res.render('reset', {token: req.params.token});
});

router.post('/reset', redirectHomeIfLoggedIn, function (req, res, next) {
  
  let t = translate(res.locals.locale)

  var salt = crypto.randomBytes(16);
  
  crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function(err, hashedPassword) {
    if (err) { return next(err); }
    let user = db.fetchRecord('users', {reset_password_token: req.body.token}, USER_ATTRS)
    if (!user) {
      req.flash('error', t('Internal_error'))
      return res.redirect('/reset/'+req.body.token)
    }
    let info = db.prepare('UPDATE users SET encrypted_password = ?, salt = ?, updated_at = ? WHERE reset_password_token = ?').run(hashedPassword, salt, now(), req.body.token)
    if (info.changes != 1) {
      req.flash('error', t('Internal_error'))
      return res.redirect('/reset/'+req.body.token)
    }
    loginUser(user, req, res, next)
  });
});

router.get('/waiting_confirm', redirectHomeIfLoggedIn, function(req, res, next) {
  res.render('waiting_confirm')
})

router.get('/waiting_reset', redirectHomeIfLoggedIn, function(req, res, next) {
  res.render('waiting_reset')
})

router.get('/confirm_signup', function(req, res, next) {
  const user = db.fetchRecord('users', {confirm_email_token: req.query.token}, ['email', 'email_validated', ...USER_ATTRS])
  if (user) {
    if (!user.email_validated) {
      user.findAndUpdateRecord('users', user, {email_validated: 1}, req.user)
    }
    loginUser(user, req, res, next)
  } else {
    req.flash('error', t('Internal_error'))
    res.redirect('/signup')
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

  let {email, name, password} = req.body
  let username = normalizeSearchText(name)
  let t = translate(res.locals.locale)

  let allUsers = db.fetchTable('users', {}, ['username', 'email'])

  function validateUnique(value, values, error) {
    let val = normalizeSearchText(value)
    return values.find(v => normalizeSearchText(v) == val) ? error : ''
  }

  if (!req.session.captchaValidatedAt || (Date.now() - req.session.captchaValidatedAt >= 5*60*1000)) {
    req.flash('error', t('Invalid_captcha'))
    return res.redirect(localeHref('/signup', req.originalUrl));
  }

  let errors = [
    validateEmail(email),
    validateUsername(username),
    validatePassword(password),
    validateUnique(email, allUsers.map(u=>u.email), 'Email_not_unique'),
    validateUnique(username, allUsers.map(u=>u.username), 'Username_not_unique')
  ].filter(f => f)

  if (errors.length === 0) {

    var salt = crypto.randomBytes(16);
    crypto.pbkdf2(password, salt, 310000, 32, 'sha256', function(err, hashedPassword) {
      if (err) { return next(err); }
      try {
        var token = crypto.randomUUID();
        let q = 'INSERT INTO users (email, name, username, confirm_email_token, encrypted_password, salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        let info = db.prepare(q).run(email, name, username, token, hashedPassword, salt, now(), now())
        if (info.changes != 1) {throw "Error creating user in database."}
        var link = res.locals.origin+'/confirm_signup?token=' + token;
        var msg = {
          to: email,
          from: 'admin@hedacuisine.com',
          subject: 'Sign in to HedaCuisine',
          text: t('Hello')+'! '+t('Sign_in_email')+'.\r\n\r\n' + link,
          html: '<h3>'+t('Hello')+'!</h3><p>'+t('Sign_in_email')+'.</p><p><a href="' + link + '">'+t('Sign_in')+'</a></p>',
        };
        sendgrid.send(msg);
        res.redirect(localeHref('/waiting_confirm', req.originalUrl))
      } catch (err) {
        console.log('CREATE USER ERROR:', err)
        if (err.code && err.code === "SQLITE_CONSTRAINT_UNIQUE") { // SqliteError
          req.flash('error', t('Account_already_associated'))
          res.redirect(localeHref('/signup', req.originalUrl));
        }
      }
    })
  } else {
    req.flash('error', errors.map(e => t(e)).join('. '))
    res.redirect(localeHref('/signup', req.originalUrl));
  }
});

export default router;