// Setup
function oacp (namespace) {
  var self = this
  self.ns = namespace
  return self
}
// oacp.prototype.server = require('./lib/server')
oacp.prototype.model = (model) => require('./lib/model')(this.ns, model)
// oacp.prototype.controller = require('./lib/controller')

// Exports
module.exports = oacp
