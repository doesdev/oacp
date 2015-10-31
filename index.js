// Setup
const HTTPServer = require('./lib/http_server')

// Exports
module.exports = Oacp

// Oacp Constructor
function Oacp (namespace) {
  var self = this
  self.models = {}
  self.channels = {}
  self.config = require('./config/app')
  self._ns = namespace || self.config.app.namespace
  self.server = {http: new HTTPServer(self)}
  return self
}

// Component Registration
// Register model, returning the new model's Class
Oacp.prototype.registerModel = function (model) {
  var app = this
  var Model = require('./lib/model')(app, model)
  app.models[Model.name] = Model
  return Model
}

// Register channel, returning instance of new channel
Oacp.prototype.registerChannel = function (channel) {
  var app = this
  var Channel = require('./lib/channel')(app, channel)
  var thisChannel = Channel.new()
  app.channels[Channel.name] = thisChannel
  return thisChannel
}
