'use strict'

// Setup
const util = require('util')
const Event = require('events').EventEmitter
const jwtoken = require('jsonwebtoken')
let app, config

// Exports
module.exports = Auth

function Auth (thisApp, token) {
  let self = this
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
  let self = this
  let algo = config.jwt.algorithm
  let secret = config.jwt.secret
  algo = algo || config.pubKey ? 'RS256' : 'HS256'
  let key = algo === 'RS256' ? config.pubKey : secret
  jwtoken.verify(
    token,
    key,
    {
      algorithm: algo,
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
  let self = this
  let user = {is: {}, can: {}}
  Object.keys(authObj).forEach((k) => user[k] = authObj[k])
  if (authObj.roles) {
    authObj.roles.forEach((r) => user.is[r.toLowerCase()] = true)
    delete user.roles
  }
  if (authObj.permit) {
    authObj.permit.forEach((p) => user.can[p.toLowerCase()] = true)
    delete user.permit
  }
  delete user.aud
  delete user.iss
  return self.emit('data', user)
}
