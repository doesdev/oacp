'use strict'

// Setup
const util = require('util')
const Event = require('events').EventEmitter
let app, env, logger, bodyParser

// Exports
module.exports = function (thisApp, channel) {
  if (typeof channel === 'string') {
    var channelName = channel.toString()
    channel = function () {}
    Object.defineProperty(channel, 'name', {
      configurable: true,
      enumerable: false,
      value: channelName,
      writable: false
    })
  }
  channel._channelName = channel.name
    .replace(/\.?([A-Z]+)/g, (x, y) => (' ' + y)).trim()
    .replace(/\s+/g, '_').toLowerCase()
  app = app || thisApp
  env = app.config.env
  logger = logger || app.config.logger
  bodyParser = require('body-parser').json(env.bodyParser)
  channel._ns = app._ns
  util.inherits(channel, Channel)
  Object.keys(Channel).map(function (e) { channel[e] = Channel[e] })
  return channel
}

function Channel () {}

util.inherits(Channel, Event)

/* CLASS METHODS */
// Return new channel
Channel.new = function (opts) {
  var Class = this
  var channel = new Class()
  var skipAuth = {}
  if (opts && opts.skipAuth) opts.skipAuth.forEach((a) => skipAuth[a] = true)
  channel.skipAuth = skipAuth
  channel.channelName = Class._channelName
  channel._ns = Class._ns
  channel.http = app.server.http.express
  channel.initRoutes()
  return channel
}

/* INSTANCE METHODS */
// Initialize routes
Channel.prototype.initRoutes = function () {
  var self = this
  /* HTTP Routes */
  var channelRoot = `${env.baseUrl || ''}/${self.channelName}/`
  // VALIDATE
  // GET: /channel/_validate
  self.http.get(channelRoot + '_validate/', (req, res) => res.send(true))
  // SEARCH
  // GET: /channel
  self.http.get(channelRoot, function (req, res) {
    Object.keys(req.query).map((k) => {
      req.params[k] = req.params[k] || req.query[k]
    })
    if (self.skipAuth.search) return self.emit('route-search', req, res)
    app.server.http.authenticate(req, res)
    req.once('authenticated', function (req, res) {
      return self.emit('route-search', req, res)
    })
  })
  // CREATE
  // POST: /channel
  self.http.post(channelRoot, bodyParser, function (req, res) {
    Object.keys(req.body).map(function (k) { req.params[k] = req.body[k] })
    if (self.skipAuth.create) return self.emit('route-create', req, res)
    app.server.http.authenticate(req, res)
    req.once('authenticated', function (req, res) {
      return self.emit('route-create', req, res)
    })
  })
  // READ
  // GET: /channel/:id
  self.http.get(channelRoot + ':id', function (req, res) {
    Object.keys(req.query).map((k) => {
      req.params[k] = req.params[k] || req.query[k]
    })
    if (self.skipAuth.read) return self.emit('route-read', req, res)
    app.server.http.authenticate(req, res)
    req.once('authenticated', function (req, res) {
      return self.emit('route-read', req, res)
    })
  })
  // UPDATE
  // PUT: /channel/:id
  self.http.put(channelRoot + ':id', bodyParser, function (req, res) {
    Object.keys(req.body).map(function (k) { req.params[k] = req.body[k] })
    if (self.skipAuth.update) return self.emit('route-update', req, res)
    app.server.http.authenticate(req, res)
    req.once('authenticated', function (req, res) {
      return self.emit('route-update', req, res)
    })
  })
  // DELETE
  // DELETE: /channel/:id
  self.http.delete(channelRoot + ':id', function (req, res) {
    Object.keys(req.query).map((k) => {
      req.params[k] = req.params[k] || req.query[k]
    })
    if (self.skipAuth.delete) return self.emit('route-delete', req, res)
    app.server.http.authenticate(req, res)
    req.once('authenticated', function (req, res) {
      return self.emit('route-delete', req, res)
    })
  })
}
