'use strict'

// Setup
const util = require('util')
const Event = require('events').EventEmitter
var app, logger, access

// Exports
module.exports = function (thisApp, controller, opts) {
  if (typeof controller === 'string') {
    var controllerName = controller.toString()
    controller = function () {}
    Object.defineProperty(controller, 'name', {
      configurable: true,
      enumerable: false,
      value: controllerName,
      writable: false
    })
  }
  controller._controllerName = controller.name
    .replace(/\.?([A-Z]+)/g, (x, y) => (' ' + y)).trim()
    .replace(/\s+/g, '_').toLowerCase()
  app = app || thisApp
  logger = logger || app.config.logger
  access = app.config.access
  controller._ns = app._ns
  opts = (opts.constructor === Object) ? opts : {}
  controller.whitelist = opts.whitelist
  controller.paramsProcessor = opts.paramsProcessor
  controller.Model = app.models[controller.name]
  util.inherits(controller, Controller)
  Object.keys(Controller).map(function (e) { controller[e] = Controller[e] })
  return controller
}

function Controller () {}

// Inherit EventEmitter
util.inherits(Controller, Event)

/* CLASS METHODS */
// Spin up a new instance of Controller
Controller.new = function () {
  var Class = this
  var controller = new Class()
  controller.channel = app.channels[Class.name]
  controller._listen()
  controller._channelListeners()
  return controller
}

/* INSTANCE HELPERS */
// Init channels
Controller.prototype._listen = function () {
  var self = this
  self.channel
    .on('error', function (err) { logger.warn(err) })
    .on('route-search', self._search.bind(self))
    .on('route-create', self._create.bind(self))
    .on('route-read', self._read.bind(self))
    .on('route-update', self._update.bind(self))
    .on('route-delete', self._delete.bind(self))
}

// Init per-channel responder listeners
Controller.prototype._channelListeners = function () {
  var self = this
  self.on('json-body', function (req, res, data) {
    app.server.http.emit('json-body', req, res, data)
    return
  })
  self.on('error', function (req, res, err) {
    err = typeof err === 'string' ? new Error(err) : err
    err.meta = err.meta || {area: 'Controller.prototype._channelListeners'}
    app.server.http.emit('error', req, res, err)
    return
  })
  self.on('invalid-params', function (req, res) {
    app.server.http.emit('invalid-params', req, res)
    return
  })
  self.on('unauthorized', function (req, res) {
    app.server.http.emit('unauthorized', req, res)
    return
  })
}

// If params valid return true, else emit invalid-params and return false
Controller.prototype._paramsValid = function (req, res, requireId) {
  var self = this
  if (!req.params || (requireId && !req.params.id)) {
    self.emit('invalid-params', req, res)
    return false
  }
  return true
}

// Return only whitelisted params
Controller.prototype._clean = function (params, req) {
  var self = this
  params = params || {}
  var paramsOut = {}
  Object.keys(params).forEach((k) => { paramsOut[k] = params[k] })
  if (self.constructor.whitelist) {
    self.constructor.whitelist.forEach((p) => { paramsOut[p] = params[p] })
  }
  if (self.constructor.paramsProcessor) {
    paramsOut = self.constructor.paramsProcessor(paramsOut, req)
  }
  return paramsOut
}

/* CONTROLLER ACTIONS */

// [chHTTP]
// GET: /model
// returns 200 with record array in body or 401 / 422
Controller.prototype._search = function (req, res) {
  var self = this
  var runSearch = () => {
    var params = self._clean(req.params, req)
    var finder = self.constructor.Model.findAll(params)
    finder.once('error', function (err) { self.emit('error', req, res, err) })
    finder.once('data', function (records) {
      if (self.search && !self.searchRules) return self.search(req, res, records)
      records = records.filter(function (r) {
        return access.allow(req.auth, r.attrs, self.searchRules)
      }).map(function (r) { return r.attrs })
      if (self.search) return self.search(req, res, records)
      self.emit('json-body', req, res, records)
      if (self.afterSearch) return self.afterSearch(req, res, records)
    })
  }
  self.beforeSearch
    ? self.beforeSearch(req, res, runSearch)
    : runSearch()
}

// [chHTTP]
// POST: /model
// returns 200 with record.attrs in body or 401 / 422
Controller.prototype._create = function (req, res) {
  var self = this
  if (!self._paramsValid(req, res)) return
  var runCreate = () => {
    if (!access.allow(req.auth, req.params, self.createRules)) {
      return self.emit('unauthorized', req, res)
    }
    var params = self._clean(req.params, req)
    var record = self.constructor.Model.new(params)
    record.new_record = true
    record.once('error', function (err) { self.emit('error', req, res, err) })
    record.once('saved', function () {
      if (self.create) return self.create(req, res, record)
      self.emit('json-body', req, res, record.attrs)
      if (self.afterCreate) return self.afterCreate(req, res, record)
    })
    record.save()
  }
  self.beforeCreate
    ? self.beforeCreate(req, res, runCreate)
    : runCreate()
}

// [chHTTP]
// GET: /model/:id
// returns 200 with record.attrs in body or 401 / 422
Controller.prototype._read = function (req, res) {
  var self = this
  if (!self._paramsValid(req, res)) return
  var runRead = () => {
    var id = parseInt(req.params.id, 10)
    var params = self._clean(req.params, req)
    var record = self.constructor.Model.find(id, params)
    record.once('error', function (err) { self.emit('error', req, res, err) })
    record.once('data', function () {
      if (!access.allow(req.auth, record.attrs, self.readRules)) {
        return self.emit('unauthorized', req, res)
      }
      if (self.read) return self.read(req, res, record)
      self.emit('json-body', req, res, record.attrs)
      if (self.afterRead) return self.afterRead(req, res, record)
    })
  }
  self.beforeRead
    ? self.beforeRead(req, res, runRead)
    : runRead()
}

// [chHTTP]
// PUT: /model/:id
// returns 200 with success message in body or 401 / 422
Controller.prototype._update = function (req, res) {
  var self = this
  if (!self._paramsValid(req, res)) return
  var runUpdate = () => {
    var id = parseInt(req.params.id, 10)
    var params = self._clean(req.params, req)
    var record = self.constructor.Model.find(id, params)
    record.once('error', function (err) { self.emit('error', req, res, err) })
    record.once('data', function () {
      if (!access.allow(req.auth, record.attrs, self.updateRules)) {
        return self.emit('unauthorized', req, res)
      }
      record.once('saved', function () {
        if (self.update) return self.update(req, res, record)
        self.emit('json-body', req, res, record.attrs)
        if (self.afterUpdate) return self.afterUpdate(req, res, record)
      })
      record.attrs = record.attrs || {}
      Object.keys(params).forEach((k) => { record.attrs[k] = params[k] })
      record.save()
    })
  }
  self.beforeUpdate
    ? self.beforeUpdate(req, res, runUpdate)
    : runUpdate()
}

// [chHTTP]
// DELETE: /model/:id
// returns 200 with success message in body or 401 / 422
Controller.prototype._delete = function (req, res) {
  var self = this
  if (!self._paramsValid(req, res)) return
  var runDelete = () => {
    var id = parseInt(req.params.id, 10)
    var params = self._clean(req.params, req)
    var record = self.constructor.Model.find(id, params)
    record.once('error', function (err) { self.emit('error', req, res, err) })
    record.once('data', function () {
      if (!access.allow(req.auth, record.attrs, self.deleteRules)) {
        return self.emit('unauthorized', req, res)
      }
      record.once('deleted', function () {
        if (self.delete) return self.delete(req, res, record)
        self.emit('json-body', req, res, 'success')
        if (self.afterDelete) return self.afterDelete(req, res, record)
      })
      record.destroy(id, params)
    })
  }
  self.beforeDelete
    ? self.beforeDelete(req, res, runDelete)
    : runDelete()
}
