const namespace = 'testapp'
const Oacp = require('./../index')
var app = new Oacp(namespace)
const assert = require('assert')
function User () {}

describe('Oacp', function () {
  describe('app', () =>
    it('should be instance of oacp', () =>
      assert.equal(app.constructor.name, 'oacp')
    )
  )
  describe('app.namespace', () =>
    it('should equal namespace', () =>
      assert.equal(app.namespace, namespace)
    )
  )
  describe('app.registerModel(User)', function () {
    app.registerModel(User)
    it('should extend Record on User', () =>
      assert(User.new instanceof Function)
    )
    it('should cause User to inherit from Record', () =>
      assert((User.new()).save instanceof Function)
    )
  })
})
