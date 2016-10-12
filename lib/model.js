'use strict'

// Setup
const util = require('util')
const Event = require('events').EventEmitter
let app, logger

// Exports
module.exports = function (thisApp, model) {
  if (typeof model === 'string') {
    let modelName = model.toString()
    model = function () {}
    Object.defineProperty(model, 'name', {
      configurable: true,
      enumerable: false,
      value: modelName,
      writable: false
    })
  }
  model._modelName = model.name
    .replace(/\.?([A-Z]+)/g, (x, y) => (' ' + y)).trim()
    .replace(/\s+/g, '_').toLowerCase()
  app = app || thisApp
  logger = logger || app.config.logger
  model._ns = app._ns
  util.inherits(model, Record)
  Object.keys(Record).map(function (e) { model[e] = Record[e] })
  return model
}

// Record class
function Record () {}

// Inherit EventEmitter
util.inherits(Record, Event)

/* CLASS METHODS */
// Return new record (not persisted to db)
Record.new = function (params) {
  let Class = this
  let record = new Class()
  record.model = Class._modelName
  record._ns = Class._ns
  record.attrs = params
  return record
}

// Return new record (persisted to db)
Record.create = function (params) {
  let Class = this
  let record = Class.new(params)
  record.on('saved', function () { record.emit('created') })
  record.save()
  return record
}

// Get record from DB
Record.find = function (recordid, params) {
  let Class = this
  let model = Class._modelName
  let record = Class.new()
  let spName = Class._ns + '_' + model + '_read'
  let args = {id_array: [parseInt(recordid, 10)]}
  if (params && params.constructor === Object) {
    Object.keys(params).forEach((k) => {
      args[k] = args[k] || params[k]
    })
  }
  record._callSP(spName, args, function () {
    return record.emit('data')
  })
  return record
}

// Get records from DB
Record.findAll = function (params) {
  let Class = this
  let model = Class._modelName
  let evt = new Event()
  let pg = app.PG.new()
  let spName = Class._ns + '_' + model + '_search'
  function errHandler (err) {
    pg.removeListener('data', dataHandler)
    err.meta = {area: 'Record.findAll', spName}
    return evt.emit('error', err)
  }
  function dataHandler (data) {
    pg.removeListener('error', errHandler)
    let records = (data.rows[0][spName] || []).map(function (u) {
      return Class.new(u)
    })
    evt.emit('data', records)
  }
  pg.once('error', errHandler)
  pg.once('data', dataHandler)
  pg.sp(spName, [params])
  return evt
}

/* INSTANCE HELPERS */
// SP Helper
Record.prototype._callSP = function (spName, args, callback) {
  let self = this
  let pg = app.PG.new()
  function errHandler (err) {
    pg.removeListener('data', dataHandler)
    err.meta = {area: 'Record.prototype._callSP', spName}
    return self.emit('error', err)
  }
  function dataHandler (data) {
    pg.removeListener('error', errHandler)
    self.attrs = data.rows[0][spName] ? data.rows[0][spName][0] : null
    callback(data)
  }
  pg.once('error', errHandler)
  pg.once('data', dataHandler)
  pg.sp(spName, [args])
}

/* INSTANCE METHODS */
// Save our record to db
Record.prototype.save = function () {
  let self = this
  let spName = self.new_record
    ? self._ns + '_' + self.model + '_create'
    : self._ns + '_' + self.model + '_update'
  self._callSP(spName, self.attrs, function () { return self.emit('saved') })
}

// Mark record deleted in db
Record.prototype.destroy = function (recordid, params) {
  let self = this
  let spName = self._ns + '_' + self.model + '_delete'
  let args = {id_array: [parseInt(recordid, 10)]}
  if (params && params.constructor === Object) {
    Object.keys(params).forEach((k) => {
      args[k] = args[k] || params[k]
    })
  }
  self._callSP(spName, args, function () { return self.emit('deleted') })
}
