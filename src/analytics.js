import fs from 'fs';
import path from 'path';
import ipware from '@fullerstack/nax-ipware';

import lazyDb from './lazy_db.js';
import {now, hashCode, printDateYMD, printDateYM} from './utils.js';
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

// PRAGMA table_info(table_name);
const schemaV2 = {
  'requests': {
    attrs: [
      ["url", "TEXT"],
      ["status",	"INTEGER"],
      ["ip_hash",	"TEXT"],
      ["error",	"TEXT"],
      ["referrer", "TEXT"],
    ],
    write_attrs: ['url', 'status', 'error', 'referrer', 'ip_hash'],
    is_allowed: user => true
  },
  'daily_visits': {
    attrs: [],
    write_attrs: [],
    is_allowed: user => true
  },
  'stats': {
    attrs: [
      ["key", "TEXT"],
      ["date",	"TEXT"],
      ["value",	"TEXT"],
      ["count",	"INTEGER"],
    ],
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

  // GOOD CODE, COMMENTED BECAUSE NOT DESTROYED */
  let dailyUniqueVisits = _.groupBy(dailyVisits, (visit) => printDateYMD(new Date(visit.created_at)))
  _.keys(dailyUniqueVisits).forEach((day) => {
    let n = dailyUniqueVisits[day].length
    db.createRecord('stats', {key: 'daily_visits', date: day, value: n, count: n})
  })

  let dailyRequests = _.groupBy(requests, (o) => printDateYMD(new Date(o.created_at)))
  _.keys(dailyRequests).forEach((day) => {
    let rs = dailyRequests[day]

    let dailyStatus = _.groupBy(rs, (o) => o.status)
    _.keys(dailyStatus).forEach(_status => {
      let n = dailyStatus[_status].length
      db.createRecord('stats', {key: 'daily_status', date: day, value: _status, count: n})
    })

    let dailyUrlRoots = _.groupBy(rs, (o) => o.url.split('/').slice(0,-1).join('/'))
    _.keys(dailyUrlRoots).forEach(url => {
      let n = dailyUrlRoots[url].length
      // db.createRecord('stats', {key: 'daily_url_roots', date: day, value: url, count: n})
    })
  })

  let monthlyRequests = _.groupBy(requests, (o) => printDateYM(new Date(o.created_at)))
  _.keys(monthlyRequests).forEach((month) => {
    let rs = monthlyRequests[month]
    let urls = _.groupBy(rs, (o) => o.url)
    _.keys(urls).forEach(url => {
      let n = urls[url].length
      db.createRecord('stats', {key: 'montly_urls', date: month, value: url, count: n})
    })
  })
}

analytics.fetchStats = () => {
  return db.fetchTable('stats', {}, ['key', 'value', 'date', 'count'])
}

export default analytics;
