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
import pluralize from 'pluralize';
import http from 'http';
import debugModule from 'debug';
import fs from 'fs';
const debug = debugModule('todos:server');
import fileUpload from 'express-fileupload';
import _ from 'lodash';

import { build } from "esbuild";
import chokidar from "chokidar";
import sass from 'sass';

// FIXME: How to import in dev only?
import livereload from 'livereload';
import connectLivereload from 'connect-livereload';

import { tr } from './translate.js'

// pass the session to the connect sqlite3 module
// allowing it to inherit from session.Store
import SQLiteStoreModule from 'connect-sqlite3'
const SQLiteStore = SQLiteStoreModule(session);

import router from './router.js';
import { getUrlParams } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = process.env.ENVIRONMENT
}

// Backup database every day
//setInterval(() => {
//  db.doBackup()
//}, 24*60*60*1000)

var app = express();

// LIVE RELOAD IN DEV
if (process.env.ENVIRONMENT == "dev") {
  console.log('Setting live reload for development environment.')

  // Setup js file builder
  const builder = await build({
    // Bundles JavaScript.
    bundle: true,
    // Defines env variables for bundled JavaScript; here `process.env.NODE_ENV`
    // is propagated with a fallback.
    define: { "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development") },
    // Bundles JavaScript from (see `outfile`).
    entryPoints: ["src/react/app.jsx", "src/react/user_editor.jsx", "src/react/home.jsx", "src/react/show_user.jsx", "src/react/show_recipe.jsx"],
    // Uses incremental compilation (see `chokidar.on`).
    incremental: true,
    // Removes whitespace, etc. depending on `NODE_ENV=...`.
    minify: process.env.NODE_ENV === "production" || process.env.NODE_ENV === "prod",
    // Bundles JavaScript to (see `entryPoints`).
    outdir: "public/build",
  
    sourcemap: true,
  })

  // open livereload high port and start to watch public directory for changes
  //const liveReloadServer = livereload.createServer({exts: ['js', 'css'], applyCSSLive: false});
  const liveReloadServer = livereload.createServer();
  liveReloadServer.watch(path.join(__dirname, '../public/build/'));
  
  // ping browser on Express boot, once browser has reconnected and handshaken
  liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
      liveReloadServer.refresh("/");
    }, 100);
  });
  
  // monkey patch every served HTML so they know of changes
  app.use(connectLivereload());

  // Setup watch for building js files
  chokidar.watch("src/**/*.{js,jsx}", {
      interval: 0, // No delay
    }).on("all", () => {
      console.log('************** REBUILDING JS ***************')
      // Rebuilds esbuild (incrementally -- see `build.incremental`).
      builder.rebuild()
    })
  
  // Setup watch for building sass files
  chokidar.watch("src/**/*.scss", {
      interval: 0, // No delay
    }).on("all", (type, filename) => {
      console.log('************** REBUILDING CSS ***************')
      let p = path.join(__dirname, filename.substr(4))
      let name = path.basename(filename)
      name = name.substr(0, name.length-4)+'css'
      let out = path.join(__dirname, '../public/build', name)
      const result = sass.compile(p);
      console.log('out', out)
      fs.writeFile(out, result.css, function (err) {
        if (err) return console.log(err);
      });
    })
}

// view engine setup
app.set('views', path.join(path.join(__dirname, '..'), 'views'));
app.set('view engine', 'ejs');

// TODO: Put these functions inside helpers
app.locals.pluralize = pluralize;
const getPathFromUrl = (url) => {
  if (!url) {return ''}
  return url.split(/[?#]/, 1)[0];
}
app.locals.getPathFromUrl = getPathFromUrl
// FIXME: Should I sanitize the inputs?
const linkToBegin = (req, href, options={}) => {

  const {className} = options
  let locale = req.query.locale;
  let path = getPathFromUrl(href);
  let current = _.pick(getUrlParams(req.originalUrl), 'locale');
  let params = {...current, ...getUrlParams(href)}
  console.log('2', params)
  let url = path
  if (params && Object.keys(params).length >= 1) {
    url += '?' + new URLSearchParams(params).toString()
  }
  console.log('3', url)

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

app.use(logger('dev'));
app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../node_modules/bootstrap/dist/')));
app.use(express.static(path.join(__dirname, '../node_modules/@popperjs/core/dist/')));
app.use(express.static(path.join(__dirname, '../node_modules/toastr/')));
app.use(express.static(path.join(__dirname, '../node_modules/prosemirror-menu/style/')));
app.use(express.static(path.join(__dirname, '../public')));

if (!fs.existsSync('./var')) {
  fs.mkdirSync('./var')
  fs.mkdirSync('./var/db')
} else if (!fs.existsSync('./var/db')) {
  fs.mkdirSync('./var/db')
}
app.use(session({
  secret: 'keyboard cat',
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  store: new SQLiteStore({ db: 'sessions.db', dir: './var/db' })
}));
app.use(csrf());
app.use(passport.authenticate('session'));
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
  res.locals.locale = req.query.locale || 'EN';
  res.locals.req = req;
  next();
});

app.use('/', router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {

  //if (req.app.get('env') === 'development') {
  if (process.env.ENVIRONMENT == "dev") {

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
