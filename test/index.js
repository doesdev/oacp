// Setup
const namespace = 'testapp'
const Oacp = require('./../index')
var app = new Oacp(namespace)
const assert = require('assert')
const http = require('http')

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
  describe('app.config.app.namespace', function () {
    it('should equal namespace', () =>
      assert.equal(app.config.app.namespace, namespace)
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
  describe('app.registerModel(\'User\')', function () {
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
    it('should be instance of User::Record', () =>
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
  describe('app.server.http', function () {
    it('should be instance of HTTPServer', () =>
      assert.equal(app.server.http.constructor.name, 'HTTPServer')
    )
    it('should inherit from EventEmitter', () =>
      assert(app.server.http.emit instanceof Function)
    )
  })
  describe('userChannel = app.registerChannel(\'User\')', function () {
    var userChannel = app.registerChannel('User')
    it('should be instance of User::Channel', () =>
      assert.equal(userChannel.constructor.name, 'User')
    )
    it('should inherit from Channel', () =>
      assert(userChannel.initRoutes instanceof Function)
    )
    it('should inherit from EventEmitter', () =>
      assert(userChannel.emit instanceof Function)
    )
  })
  describe('userChannel.http: route -> GET /user/_validate', function () {
    var result = false
    beforeEach(function getRequest (done) {
      http.get('http://localhost:8080/user/_validate', function (res) {
        res.on('data', function (data) {
          result = data.toString() === 'true'
          done()
        })
      }).on('error', (err) => done(err))
    })
    it('should return true', () => assert(result))
  })
  describe('userChannel.http: route -> GET /user, no token', function () {
    var result = false
    beforeEach(function getRequest (done) {
      http.get('http://localhost:8080/user', function (res) {
        res.on('data', function (data) {
          result = res.statusCode === 401
          done()
        })
      }).on('error', (err) => done(err))
    })
    it('should return 401 status', () => assert(result))
  })
})
