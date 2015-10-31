// Setup
const HTTPServer = require('./lib/http_server')

// Exports
module.exports = Oacp

// Oacp Constructor
function Oacp (namespace) {
  var self = this
  self.models = {}
  self.config = require('./config/app')
  self._ns = namespace || self.config.app.namespace
  self.server = {http: new HTTPServer(self)}
  return self
}

// Component Registration
Oacp.prototype.registerModel = function (model) {
  var app = this
  var thisModel = require('./lib/model')(app, model)
  app.models[thisModel.name] = thisModel
  return thisModel
}
