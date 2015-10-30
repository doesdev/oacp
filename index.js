// Setup
var config = require('./config/app')
function oacp (namespace) {
  var self = this
  self._ns = namespace || config.app.namespace
  return self
}
// oacp.prototype.Server = require('./lib/server')
oacp.prototype.registerModel = function (model) {
  return require('./lib/model')(this._ns, model)
}
// oacp.prototype.Controller = require('./lib/controller')

// Exports
module.exports = oacp
