// Setup
const util = require('util')
const Event = require('events').EventEmitter
const jwtoken = require('jsonwebtoken')
var app, config

// Exports
module.exports = Auth

function Auth (thisApp, token) {
  var self = this
  app = thisApp
  config = app.config
  self.emit('ready')
  function noCredErr () {
    return self.emit('error', 'No valid token received')
  }
  if (!token) {
    setTimeout(noCredErr, 50)
    return self
  }
  self.validateToken(token)
  return self
}

util.inherits(Auth, Event)

Auth.prototype.validateToken = function (token) {
  var self = this
  jwtoken.verify(
    token,
    config.pubKey,
    {
      algorithm: 'RS256',
      issuer: config.jwt.issuer || config.app.ns,
      audience: 'client'
    },
    function (err, data) {
      if (err) return self.emit('error', err)
      return self.setAuthObject(data)
    }
  )
}

Auth.prototype.setAuthObject = function (authObj) {
  var self = this
  var user = {
    userid: authObj.userid,
    officeid: authObj.officeid,
    all_locations: authObj.all_locations,
    managed_offices: authObj.managed_offices,
    is: {},
    can: {}
  }
  if (authObj.roles) {
    authObj.roles.forEach(function (r) {
      user.is[r.toLowerCase()] = true
    })
  }
  if (authObj.permit) {
    authObj.permit.forEach(function (p) {
      user.can[p.toLowerCase()] = true
    })
  }
  return self.emit('data', user)
}
