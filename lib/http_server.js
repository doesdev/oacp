'use strict'

// Setup
const util = require('util')
const Event = require('events').EventEmitter
const Express = require('express')
const cors = require('cors')
const Auth = require('./jwt_auth')
let express = Express()
let app, logger, env

// Exports
module.exports = HTTPServer

function HTTPServer (thisApp) {
  var self = this
  app = app || thisApp
  logger = logger || app.config.logger
  env = app.config.env
  self.startServer()
  self.handleErrors()
  self.responseListeners()
  return self
}

util.inherits(HTTPServer, Event)

/* INSTANCE METHODS */
// Initialize server
HTTPServer.prototype.startServer = function () {
  let self = this
  let port = env.PORT || env.port || 8080
  self.express = express
  function callReady () { logger.debug(`HTTP listening on ${port}`) }
  let corsOptions = {
    origin: function (origin, callback) {
      let allow = (
        env.cors.whitelist === '*' ||
        env.cors.whitelist.indexOf(origin) !== -1 ||
        env.cors.whitelist.indexOf('*') !== -1
      )
      callback(null, allow)
    }
  }
  if (env.cors.preflight) self.express.options('*', cors())
  self.express.use(cors(corsOptions))
  self.express.listen(port, callReady)
}

// Response listeners
HTTPServer.prototype.responseListeners = function () {
  var self = this
  self.on('json-body', function (req, res, data) {
    res.send({data: data})
  })
  self.on('error', function (req, res, err) {
    logger.fatal(err || '500 Error: Not sure why yo?')
    res.headersSent
      ? res.end
      : res.status(500).send({error: 'Exception occurred and has been logged'})
  })
  self.on('unauthorized', function (req, res) {
    res.headersSent
      ? res.end
      : res.status(401).send({error: 'Requested action unavailable to user'})
  })
  self.on('invalid-params', function (req, res) {
    res.headersSent
      ? res.end
      : res.status(422).send({error: 'Invalid parameters provided'})
  })
}

// Error handleage
HTTPServer.prototype.handleErrors = function () {
  var self = this
  self.express.use(function (err, req, res, next) {
    if (res.headersSent) return next(err)
    if (err) return self.emit('error')
  })
}

// Set authObject
HTTPServer.prototype.authenticate = function (req, res) {
  var self = this
  var token = req.header('Authorization')
  function unauthorized () { return self.emit('unauthorized', req, res) }
  if (!token) return unauthorized()
  token = token.replace(/^Bearer\s/, '')
  var auth = new Auth(app, token)
  auth.once('error', function (e) {
    logger.fatal(e)
    return unauthorized()
  })
  auth.once('data', function (authObject) {
    req.auth = authObject
    return req.emit('authenticated', req, res)
  })
}
