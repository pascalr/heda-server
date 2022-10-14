import passport from 'passport';
import LocalStrategy from 'passport-local';
import crypto from 'crypto';

import {db2} from './db.js';

passport.use(new LocalStrategy(function verify(email, password, cb) {
  const row = db2.prepare('SELECT * FROM accounts WHERE email = ?').get(email)
  if (!row) { return cb(null, false, { message: 'Incorrect username or password.' }); }
  
  crypto.pbkdf2(password, row.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
    if (err) { return cb(err); }
    if (!crypto.timingSafeEqual(row.encrypted_password, hashedPassword)) {
      return cb(null, false, { message: 'Incorrect username or password.' });
    }
    let o = row;
    o.account_id = o.id;
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
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { account_id: user.account_id, email: user.email, locale: user.locale });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

export default passport;
//module.exports = passport;
