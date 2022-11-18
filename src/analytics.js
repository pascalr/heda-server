import fs from 'fs';
import path from 'path';
import ipware from '@fullerstack/nax-ipware';

import lazyDb from './lazy_db.js';
import {now, hashCode} from './utils.js';

const schema = {
  'requests': {
    write_attrs: ['url', 'status', 'error', 'referrer', 'ip_hash'],
    is_allowed: user => true
  },
  'daily_visits': {
    write_attrs: [],
    is_allowed: user => true
  }
}

// FIXME: DB_URL should be DB_PATH, it's not an URL (doesn't start with sqlite3://...)
if (!process.env.VOLUME_PATH) {throw "Error VOLUME_PATH not set..."}
let dbPath = path.join(process.env.VOLUME_PATH, 'analytics.db')
export const db = new lazyDb(dbPath, { verbose: console.log })
db.setSchema(schema)
console.log('Opening database successful!')

const analytics = {}

analytics.checkVisit = (req, res, next) => {

  let last = req.session.dailyVisit
  let t = new Date().getTime()
  //if (!last || (t - last > 24*60*60*1000)) {
  if (!last) {
    console.log('last', last)
    req.session.dailyVisit = t
    db.createRecord('daily_visits', {})
  }
  req.on("end", function() {
    analytics.addRequest(req, res)
  });
  next()
}

analytics.addRequest = (req, res) => {
  let data = {
    referrer: req.headers.referer,
    ip_hash: hashCode(ipware.getIpFromRequest(req)),
    url: req.originalUrl,
    status: res.statusCode,
  }
  db.createRecord('requests', data)
}

analytics.nbRequestsTotal = () => {
  return db.prepare('SELECT COUNT(*) FROM requests').get()['COUNT(*)']
}
analytics.nbDailyVisitsTotal = () => {
  return db.prepare('SELECT COUNT(*) FROM daily_visits').get()['COUNT(*)']
}

export default analytics;
