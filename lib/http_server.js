// Setup
const util = require('util')
const Event = require('events').EventEmitter
const Express = require('express')
const Auth = require('./jwt_auth')
var express = Express()
var app, logger

// Exports
module.exports = HTTPServer

function HTTPServer (thisApp) {
  var self = this
  app = app || thisApp
  logger = logger || app.config.logger
  self.startServer()
  self.handleErrors()
  self.responseListeners()
  return self
}

util.inherits(HTTPServer, Event)

/* INSTANCE METHODS */
// Initialize server
HTTPServer.prototype.startServer = function () {
  var self = this
  self.express = express
  function callReady () { logger.debug('HTTP listening on 8080') }
  self.express.listen(8080, callReady)
}

// Response listeners
HTTPServer.prototype.responseListeners = function () {
  var self = this
  self.on('json-body', function (req, res, data) {
    res.send({data: data})
  })
  self.on('error', function (req, res) {
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
  if (!token) return self.emit('unauthorized')
  token = token.replace(/^Bearer\s/, '')
  var auth = new Auth(app, token)
  auth.once('error', function (e) {
    logger.fatal(e)
    return self.emit('unauthorized', req, res)
  })
  auth.once('data', function (authObject) {
    req.auth = authObject
    return req.emit('authenticated', req, res)
  })
}
