'use strict'

// Exports
module.exports = (new Access())

function Access () {
  var self = this
  return self
}

// Check overall access against all rules and return boolean
Access.prototype.allow = function (auth, attrs, rules) {
  var self = this
  if (!rules) return false
  return rules.some(function (orRule) {
    return Array.isArray(orRule)
      ? orRule.every(function (andRule) { return self[andRule](auth, attrs) })
      : self[orRule](auth, attrs)
  })
}

// If admin return true, else emit unauthorized and return false
Access.prototype.isAdmin = (auth, attrs) => !!auth.is.admin

// If owner return true, else emit unauthorized and return false
Access.prototype.isOwner = (auth, attrs) => !!(auth.id === attrs.id)
