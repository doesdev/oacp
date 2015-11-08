// Setup
const Oacp = require('oacp')
var app = new Oacp()

// Initialize models
'{{regModels}}'

// Initialize channels
'{{regChannels}}'

// Initialize controllers
/*
  Alternately, you can override the controllers like this:
  require('./resource/controller')(
    app.registerController('Resource', require('./resource/whitelist'))
  )
  Of course, you need to have those files setup right.
*/
'{{regControllers}}'
