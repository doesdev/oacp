// Setup
const util = require('util')
const Event = require('events').EventEmitter
const jwtoken = require('jsonwebtoken')
const config = require('./../config/app')
const pubKey = config.pubKey

// Exports
module.exports = Auth

function Auth (token) {
  var self = this
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
    pubKey,
    {
      algorithm: 'RS256',
      issuer: config.app.name,
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
  authObj.roles.forEach(function (r) {
    user.is[r.toLowerCase()] = true
  })
  authObj.permit.forEach(function (p) {
    user.can[p.toLowerCase()] = true
  })
  return self.emit('data', user)
}
