'use strict'

// Setup
const pgsql = require('pg')
const util = require('util')
const Event = require('events').EventEmitter
let app, config

// Exports
module.exports = function (thisApp) {
  app = thisApp
  config = app.config
  return PG
}

function PG () {
  var self = this
  function connect () { return self.connect() }
  setTimeout(connect, 0)
  return self
}

PG.new = (opts) => new PG(opts)

util.inherits(PG, Event)

/* INSTANCE METHODS */
PG.prototype.connect = function () {
  var self = this
  self.pool = self.pool || new pgsql.Pool(config.secrets.pg)
  self.pool.on('error', (err) => self.emit('error', err))
  self.emit('ready')
}

PG.prototype.emitData = function (err, data, done) {
  var self = this
  if (err) return self.emit('error', err)
  self.emit('data', data)
  if (typeof done === 'function') done()
}

PG.prototype.query = function (query, params) {
  var self = this
  self.pool.connect(function (err, client, done) {
    if (err) return self.emit('error', err)
    params
      ? client.query(query, params, self.emitData.bind(self))
      : client.query(query, self.emitData.bind(self))
  })
}

PG.prototype.sp = function (name, params) {
  var self = this
  params = params || ''
  self.pool.connect(function (err, client, done) {
    if (err) return self.emit('error', err)
    if (Array.isArray(params) && params.length > 0) {
      var paramHolders = params.map(function (p, i) { return '$' + (i + 1) })
      var paramStr = '(' + paramHolders.join(', ') + ');'
      client.query(
        'SELECT * FROM ' + name + paramStr,
        params,
        self.emitData.bind(self)
      )
      return
    }
    return client.query(
      'SELECT * FROM ' + name + paramStr,
      self.emitData.bind(self)
    )
  })
}
