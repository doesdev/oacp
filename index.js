// Setup
var config = require('./config/app')
function oacp (namespace) {
  var self = this
  self.ns = self.namespace = namespace || config.app.namespace
  return self
}
// oacp.prototype.Server = require('./lib/server')
oacp.prototype.registerModel = (model) => require('./lib/model')(model)
// oacp.prototype.Controller = require('./lib/controller')

// Exports
module.exports = oacp
