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

import { tr } from './translate.js'
import { enableLiveReload } from './livereload.js'
import { SearchWhiteIcon, PersonFillWhiteIcon } from './build/image.js'
import analytics from './analytics.js'

// pass the session to the connect sqlite3 module
// allowing it to inherit from session.Store
import SQLiteStoreModule from 'connect-sqlite3'
const SQLiteStore = SQLiteStoreModule(session);

import router from './router/main.js';
import adminRouter from './router/admin.js';
import { getUrlParams, localeHref, getPathFromUrl } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// TODO: Put these functions inside helpers
app.locals.localeHref = (req, url) => {
  return localeHref(url, req.originalUrl)
}
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
app.locals.tr = tr;
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
app.use(csrf());
app.use(passport.authenticate('session'));
// Server-side analytics
app.use(analytics.checkVisit)
app.use(function(req, res, next) {
  var msgs = req.session.messages || [];
  res.locals.messages = msgs;
  res.locals.hasMessages = !! msgs.length;
  req.session.messages = [];
  next();
});
app.use(function(req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  res.locals.href = req.url;
  res.locals.locale = (req.query.locale || 'en').toLowerCase();
  res.locals.req = req;
  res.locals.origin = req.protocol+'://'+req.get('host');
  next();
});

app.use('/', router);
app.use('/', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {

  //if (req.app.get('env') === 'development') {
  if (process.env.NODE_ENV == "development") {

    if (typeof err === 'string') {
      res.locals.message = err;
      res.locals.error = {};
    } else {
      res.locals.message = err.message;
      res.locals.error = err;
    }

    // render the error page
    res.status(err.status || 500);
    res.render('error_dev');

  } else {
    console.log('ERROR', err)
    res.redirect('/error');
  }
});

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
