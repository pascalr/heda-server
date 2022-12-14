import fs from 'fs';
import path from 'path';
import ipware from '@fullerstack/nax-ipware';

import lazyDb from './lazy_db.js';
import {now, hashCode} from './utils.js';
import _ from 'lodash';

const schema = {
  'requests': {
    write_attrs: ['url', 'status', 'error', 'referrer', 'ip_hash'],
    is_allowed: user => true
  },
  'daily_visits': {
    write_attrs: [],
    is_allowed: user => true
  },
  'stats': {
    write_attrs: ['key', 'date', 'value', 'count'],
    is_allowed: user => true
  },
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

analytics.summarize = () => {
  let dailyVisits = db.fetchTable('daily_visits', {}, ['created_at'])
  let requests = db.fetchTable('requests', {}, ['created_at', 'status', 'url'])
  let dayKey = (date) => date.getYear()+'-'+date.getMonth()+'-'+date.getDate()

  // GOOD CODE, COMMENTED BECAUSE NOT DESTROYED */
  let dailyUniqueVisits = _.groupBy(dailyVisits, (visit) => dayKey(new Date(visit.created_at)))
  _.keys(dailyUniqueVisits).forEach((day) => {
    let n = dailyUniqueVisits[day].length
    // db.createRecord('stats', {key: 'daily_visits', date: day, value: n, count: n})
  })

  let dailyRequests = _.groupBy(requests, (o) => dayKey(new Date(o.created_at)))
  _.keys(dailyRequests).forEach((day) => {
    let rs = dailyRequests[day]

    let dailyStatus = _.groupBy(rs, (o) => o.status)
    _.keys(dailyStatus).forEach(_status => {
      let n = dailyStatus[_status].length
      // db.createRecord('stats', {key: 'daily_status', date: day, value: _status, count: n})
    })

    let dailyUrlRoots = _.groupBy(rs, (o) => {
      if (o.url.includes('wp-includes')) {
        console.log('WTF', o.url)
      }
      return o.url.split('/').slice(0,-1).join('/')
    })
    _.keys(dailyUrlRoots).forEach(url => {
      let n = dailyUrlRoots[url].length
      // db.createRecord('stats', {key: 'daily_url_roots', date: day, value: url, count: n})
    })
  })
}

export default analytics;
