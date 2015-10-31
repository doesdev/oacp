// Setup
const namespace = 'testapp'
const Oacp = require('./../index')
var app = new Oacp(namespace)
const assert = require('assert')

// Tests
describe('Oacp', function () {
  describe('app', () =>
    it('should be instance of Oacp', () =>
      assert.equal(app.constructor.name, 'Oacp')
    )
  )
  describe('app.config.logger', function () {
    it('should be instance of Logger', () =>
      assert.equal(app.config.logger.constructor.name, 'Logger')
    )
  })
  describe('app.server.http', function () {
    it('should be instance of HTTPServer', () =>
      assert.equal(app.server.http.constructor.name, 'HTTPServer')
    )
  })
  describe('app._ns', () =>
    it('should equal namespace', () =>
      assert.equal(app._ns, namespace)
    )
  )
  describe('app.registerModel(User)', function () {
    const User = app.registerModel('User')
    it('should extend Record on User', () =>
      assert(User.find instanceof Function)
    )
    it('should set app.models.User to User', () =>
      assert.equal(app.models.User.name, User.name)
    )
  })
  describe('User.new()', function () {
    const User = app.registerModel('User')
    var user = User.new()
    it('should be instance of User', () =>
      assert.equal(user.constructor.name, 'User')
    )
    it('should inherit from Record', () =>
      assert(user.save instanceof Function)
    )
    it('should inherit from EventEmitter', () =>
      assert(user.emit instanceof Function)
    )
    it('should have _ns equal to namespace', () =>
      assert.equal(user._ns, namespace)
    )
  })
})
