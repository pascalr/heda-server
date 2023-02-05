#!/usr/bin/env node

import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import csrf from 'csurf';
import passport from 'passport';
import logger from 'morgan';
import { fileURLToPath } from 'url';
import http from 'http';
import debugModule from 'debug';
import fs from 'fs';
const debug = debugModule('todos:server');
import fileUpload from 'express-fileupload';
import _ from 'lodash';
import flash from 'connect-flash';
import Scheduler from './scheduler.js';

import { translate } from './translate.js'
import { enableLiveReload } from './livereload.js'
import { SearchWhiteIcon, PersonFillWhiteIcon } from './build/image.js'
import { buildSvelte } from './build_svelte.js'
import analytics from './analytics.js'

// pass the session to the connect sqlite3 module
// allowing it to inherit from session.Store
import SQLiteStoreModule from 'connect-sqlite3'
const SQLiteStore = SQLiteStoreModule(session);

import router from './router/main.js';
import loginRouter from './router/login.js';
import adminRouter from './router/admin.js';
import { getUrlParams, getPathFromUrl, urlWithLocale } from './utils.js';
import { DEFAULT_LOCALE } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


buildSvelte()

// Backup database every day
//setInterval(() => {
//  db.doBackup()
//}, 24*60*60*1000)

var app = express();

// LIVE RELOAD IN DEV
if (process.env.NODE_ENV == "development") {
  console.log('Setting live reload for development environment.')
  enableLiveReload(app)
}

// view engine setup
app.set('views', path.join(path.join(__dirname, '..'), 'views'));
app.set('view engine', 'ejs');

app.locals.getPathFromUrl = getPathFromUrl
// FIXME: Should I sanitize the inputs?
const linkToBegin = (req, href, options={}) => {

  const {className} = options
  let path = getPathFromUrl(href);
  let current = _.pick(getUrlParams(req.originalUrl), 'locale');
  let params = {...current, ...getUrlParams(href)}
  let url = path
  if (params && Object.keys(params).length >= 1) {
    url += '?' + new URLSearchParams(params).toString()
  }

  let q = '<a '
  if (className) {q += 'class="'+className+'" '}
  q += 'href="'+url+'"'
  q += '>'
  return q
}
app.locals.linkToBegin = linkToBegin
// FIXME: Should I sanitize the inputs?
app.locals.linkTo = (req, label, href, options={}) => {
  return linkToBegin(req, href, options)+label+'</a>'
}
app.locals.linkToEnd = () => ('</a>')
app.locals.loadScript = (path) => {
// I thought that esbuild would compile with .min.js as an extension, but apparently not...
//  if (process.env.NODE_ENV === 'production') {
//    return "<script src='"+path+".min.js' type='text/javascript'/></script>"
//  } else {
    return "<script src='"+path+".js' type='text/javascript' /></script>"
//  }
}
app.locals.SearchWhiteIcon = SearchWhiteIcon
app.locals.PersonFillWhiteIcon = PersonFillWhiteIcon 

app.use(logger('dev'));
app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// FIXME: This is bad because it serves all files. Only route for the specific css files required.
app.use(express.static(path.join(__dirname, '../node_modules/bootstrap/dist/')));
app.use(express.static(path.join(__dirname, '../node_modules/@popperjs/core/dist/')));
app.use(express.static(path.join(__dirname, '../node_modules/toastr/')));
app.use(express.static(path.join(__dirname, '../node_modules/prosemirror-menu/style/')));
app.use(express.static(path.join(__dirname, '../node_modules/swiper/')));
app.use(express.static(path.join(__dirname, '../node_modules/js-autocomplete/')));
app.use(express.static(path.join(__dirname, '../public')));

app.use(session({
  secret: 'keyboard cat',
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  store: new SQLiteStore({ db: 'sessions.db', dir: process.env.VOLUME_PATH })
}));
app.use(flash());
app.use(csrf());
app.use(passport.authenticate('session'));
// Server-side analytics
app.use(analytics.checkVisit)
app.use(function(req, res, next) {
  // Passport adds a message when there is a login issue to req.session.messages.
  if (req.session.messages?.length) {
    req.flash('error', req.session.messages.join('. '))
    req.session.messages = []
  }
  next();
});
app.use(function(req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  res.locals.href = req.url;
  req.user = req.session.user
  if (req.locale) {throw "Internal coding error. Can't overwrite req.locale"}
  req.locale = (req.user?.locale || req.query.l || req.query.locale || DEFAULT_LOCALE).toLowerCase();
  res.locals.locale = req.locale;
  res.locals.t = translate(req.locale)
  res.t = translate(req.locale)
  res.locals.req = req;
  res.locals.origin = req.protocol+'://'+req.get('host');
  if (req.user) {
    res.locals.user = {name: req.user.name, locale: req.locale, id: req.user.id}
    res.locals.gon = {user: res.locals.user}
  } else {
    res.locals.gon = {}
  }
  res.locals.urlWithLocale = (url) => {
    return urlWithLocale(url, req.locale)
  }
  res.uwl = (url) => {
    return urlWithLocale(url, req.locale)
  }
  res.locals.uwl = res.uwl
  next();
});

app.use('/', router);
app.use('/', loginRouter);
//app.use('/admin', adminRouter); TODO: DO THIS, BUT CHANGE ALL ROUTES DO THERE ARE RELATIVE TO /ADMIN inside adminRouter
app.use('/', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {

  console.log('Error handler', err)

  if (process.env.NODE_ENV == "development") {

    if (typeof err === 'string') {
      res.locals.message = err;
      res.locals.error = {};
    } else {
      res.locals.message = err.message;
      res.locals.error = err;
    }

    res.status(err.status || 500);
    res.render('error_dev');

  } else {
    res.status(err.status || 500);
    res.render('error');
  }
});

function sendAnalyticsEmail() {
  console.log('Sending analytics email!')
}

let config = {
  dailyTasks: [
    {title: 'Send analytics email', time: '12:04', execute: sendAnalyticsEmail}
  ]
};

const scheduler = new Scheduler(config)
scheduler.start()

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

var server = http.createServer(app);
// Listen on provided port, on all network interfaces.
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    return val; // named pipe
  }

  if (port >= 0) {
    return port; // port number
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  console.log('Server.js onError')
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
