import passport from 'passport';
import LocalStrategy from 'passport-local';
import crypto from 'crypto';

import {db} from './db.js';

passport.use(new LocalStrategy(function verify(usernameOrEmail, password, cb) {
  const user = db.prepare('SELECT * FROM users WHERE name = ?').get(usernameOrEmail)
  let account = null
  if (user) {
    account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(user.account_id)
  } else {
    account = db.prepare('SELECT * FROM accounts WHERE email = ?').get(usernameOrEmail)
  }
  // TODO: Translate error message
  let message = 'Incorrect username, email or password.'
  if (!account) { return cb(null, false, {message}); }
  
  crypto.pbkdf2(password, account.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
    if (err) { return cb(err); }
    if (!crypto.timingSafeEqual(account.encrypted_password, hashedPassword)) {
      return cb(null, false, {message});
    }
    let o = account;
    o.account_id = o.id;
    o.is_admin = o.admin;
    if (user) {o.user_id = user.id;}
    return cb(null, o);
  });
}));

/* Configure session management.
 *
 * When a login session is established, information about the user will be
 * stored in the session.  This information is supplied by the `serializeUser`
 * function, which is yielding the user ID and username.
 *
 * As the user interacts with the app, subsequent requests will be authenticated
 * by verifying the session.  The same user information that was serialized at
 * session establishment will be restored when the session is authenticated by
 * the `deserializeUser` function.
 *
 * Since every request to the app needs the user ID and username, in order to
 * fetch todo records and render the user element in the navigation bar, that
 * information is stored in the session.
 */
passport.serializeUser(function(account, cb) {
  process.nextTick(function() {
    cb(null, { is_admin: account.is_admin, account_id: account.account_id, email: account.email, locale: account.locale, user_id: account.user_id });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

export default passport;
//module.exports = passport;
