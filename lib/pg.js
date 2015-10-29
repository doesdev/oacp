// Setup
const config = require('./../config/app')
const pgsql = require('pg')
const util = require('util')
const Event = require('events').EventEmitter

// Exports
module.exports = PG

function PG () {
  var self = this
  function connect () { return self.connect() }
  setTimeout(connect, 0)
  return self
}

util.inherits(PG, Event)

/* INSTANCE METHODS */
PG.prototype.connect = function () {
  var self = this
  self.client = new pgsql.Client(config.secrets.pg)
  self.client.connect(function (err) {
    if (err) return self.emit('error', err)
    self.emit('ready')
  })
}

PG.prototype.emitData = function (err, data) {
  var self = this
  if (err) return self.emit('error', err)
  self.emit('data', data)
  self.client.end()
}

PG.prototype.query = function (query, params) {
  var self = this
  params
    ? self.client.query(query, params, self.emitData.bind(self))
    : self.client.query(query, self.emitData.bind(self))
}

PG.prototype.sp = function (name, params) {
  var self = this
  params = params || ''
  if (Array.isArray(params) && params.length > 0) {
    var paramHolders = params.map(function (p, i) { return '$' + (i + 1) })
    var paramStr = '(' + paramHolders.join(', ') + ');'
    self.client.query(
      'SELECT * FROM ' + name + paramStr,
      params,
      self.emitData.bind(self)
    )
    return
  }
  return self.client.query(
    'SELECT * FROM ' + name + paramStr,
    self.emitData.bind(self)
  )
}
