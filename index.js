// Setup
const HTTPServer = require('./lib/http_server')

// Exports
module.exports = Oacp

// Oacp Constructor
function Oacp (namespace) {
  var app = this
  app.models = {}
  app.channels = {}
  app.controllers = {}
  app.config = require('./config/app')(namespace)
  app.PG = require('./lib/pg')(app, app.config)
  app._ns = app.config.app.namespace
  app.server = {http: new HTTPServer(app)}
  return app
}

/* COMPONENT REGISTRATION */
// Register model, returning the new model's Class
Oacp.prototype.registerModel = function (model) {
  var app = this
  var Model = require('./lib/model')(app, model)
  app.models[Model.name] = Model
  return Model
}

// Register channel, returning instance of new channel
Oacp.prototype.registerChannel = function (channel, opts) {
  var app = this
  var Channel = require('./lib/channel')(app, channel)
  var thisChannel = Channel.new(opts)
  app.channels[Channel.name] = thisChannel
  return thisChannel
}

// Register controller, returning instance of new controller
Oacp.prototype.registerController = function (controller, opts) {
  var app = this
  var Controller = require('./lib/controller')(app, controller, opts)
  var thisController = Controller.new()
  app.controllers[Controller.name] = thisController
  return thisController
}
