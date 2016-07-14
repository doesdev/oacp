'use strict'

// Setup
const pgsql = require('pg')
const util = require('util')
const Event = require('events').EventEmitter
let app, config, pool

// Exports
module.exports = function (thisApp) {
  app = thisApp
  config = app.config
  pool = new pgsql.Pool(config.secrets.pg)
  pool.on('error', (err) => config.logger.fatal(err))
  return PG
}

function PG () {
  var self = this
  return self
}

PG.new = (opts) => new PG(opts)

util.inherits(PG, Event)

/* INSTANCE METHODS */
PG.prototype.emitData = function (err, data, done) {
  var self = this
  if (typeof done === 'function') done()
  if (err) return self.emit('error', err)
  self.emit('data', data)
}

PG.prototype.query = function (query, params) {
  var self = this
  pool.connect(function (err, client, done) {
    if (err) return self.emit('error', err)
    let boundEmit = (err, data) => self.emitData(err, data, done)
    params
      ? client.query(query, params, boundEmit)
      : client.query(query, boundEmit)
  })
}

PG.prototype.sp = function (name, params) {
  var self = this
  params = params || ''
  pool.connect(function (err, client, done) {
    if (err) return self.emit('error', err)
    let boundEmit = (err, data) => self.emitData(err, data, done)
    if (Array.isArray(params) && params.length > 0) {
      var paramHolders = params.map(function (p, i) { return '$' + (i + 1) })
      var paramStr = '(' + paramHolders.join(', ') + ');'
      client.query('SELECT * FROM ' + name + paramStr, params, boundEmit)
      return
    }
    return client.query('SELECT * FROM ' + name + paramStr, boundEmit)
  })
}
