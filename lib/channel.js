// Setup
const util = require('util')
const Event = require('events').EventEmitter
const bodyParser = require('body-parser').json()
var app, logger

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
  logger = logger || app.config.logger
  channel._ns = app._ns
  util.inherits(channel, Channel)
  Object.keys(Channel).map(function (e) { channel[e] = Channel[e] })
  return channel
}

function Channel () {}

util.inherits(Channel, Event)

/* CLASS METHODS */
// Return new channel
Channel.new = function () {
  var Class = this
  var channel = new Class()
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
  var channelRoot = '/' + self.channelName + '/'
  // VALIDATE
  // GET: /channel/_validate
  self.http.get(channelRoot + '_validate/', (req, res) => res.send(true))
  // SEARCH
  // GET: /channel
  self.http.get(channelRoot, function (req, res) {
    app.server.http.authenticate(req, res)
    req.once('authenticated', function (req, res) {
      return self.emit('route-search', req, res)
    })
  })
  // CREATE
  // POST: /channel
  self.http.post(channelRoot, bodyParser, function (req, res) {
    app.server.http.authenticate(req, res)
    req.once('authenticated', function (req, res) {
      Object.keys(req.body).map(function (k) { req.params[k] = req.body[k] })
      return self.emit('route-create', req, res)
    })
  })
  // READ
  // GET: /channel/:id
  self.http.get(channelRoot + ':id', function (req, res) {
    app.server.http.authenticate(req, res)
    req.once('authenticated', function (req, res) {
      return self.emit('route-read', req, res)
    })
  })
  // UPDATE
  // PUT: /channel/:id
  self.http.put(channelRoot + ':id', bodyParser, function (req, res) {
    app.server.http.authenticate(req, res)
    req.once('authenticated', function (req, res) {
      Object.keys(req.body).map(function (k) { req.params[k] = req.body[k] })
      return self.emit('route-update', req, res)
    })
  })
  // DELETE
  // DELETE: /channel/:id
  self.http.delete(channelRoot + ':id', function (req, res) {
    app.server.http.authenticate(req, res)
    req.once('authenticated', function (req, res) {
      return self.emit('route-delete', req, res)
    })
  })
}
