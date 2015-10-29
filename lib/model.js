// Setup
const util = require('util')
const Event = require('events').EventEmitter
const PG = require('./pg')
var config = require('./../config/app')
var logger = config.logger

// Exports
module.exports = function (namespace, model) {
  model._ns = namespace
  util.inherits(model, Record)
  Object.keys(Record).map(function (e) { model[e] = Record[e] })
}

// Record class
function Record () {}

// Inherit EventEmitter
util.inherits(Record, Event)

/* CLASS METHODS */
// Return new record (not persisted to db)
Record.new = function (params) {
  var record = new this()
  record._ns = this._ns
  record.attrs = params
  return record
}

// Return new record (persisted to db)
Record.create = function (params) {
  var record = this.new(params)
  record.on('saved', function () { record.emit('created') })
  record.save()
  return record
}

// Get record from DB
Record.find = function (recordid) {
  var model = this.name.toLowerCase()
  var record = this.new()
  var spName = this._ns + '_' + model + '_read'
  var args = {id_array: [parseInt(recordid, 10)]}
  record._callSP(spName, args, function () {
    return record.emit('data')
  })
  return record
}

// Get records from DB
Record.findAll = function (query) {
  var model = this.name.toLowerCase()
  var evt = new Event()
  var pg = new PG()
  var spName = this._ns + '_' + model + '_search'
  pg.on('error', function (err) {
    evt.emit('error', err)
    return logger.fatal(err)
  })
  pg.on('data', function (data) {
    var records = data.rows[0][spName].map(function (u) {
      return this.new(u)
    })
    evt.emit('data', records)
  })
  pg.on('ready', function () { pg.sp(spName, [query]) })
  return evt
}

/* INSTANCE HELPERS */
// SP Helper
Record.prototype._callSP = function (spName, args, callback) {
  var self = this
  var pg = new PG()
  pg.on('error', function (err) {
    self.emit('error', err)
    return logger.fatal(err)
  })
  pg.on('data', function (data) {
    self.attrs = data.rows[0][spName][0]
    callback(data)
  })
  pg.on('ready', function () { pg.sp(spName, [args]) })
}

/* INSTANCE METHODS */
// Save our record to db
Record.prototype.save = function () {
  var self = this
  var spName = self.new_record
    ? self._ns + '_' + self.model + '_create'
    : self._ns + '_' + self.model + '_update'
  self._callSP(spName, self.attrs, function () { return self.emit('saved') })
}

// Mark record deleted in db
Record.prototype.destroy = function (recordid) {
  var self = this
  var spName = self._ns + '_' + self.model + '_delete'
  var args = {id_array: [parseInt(recordid, 10)]}
  self._callSP(spName, args, function () { return self.emit('deleted') })
}
