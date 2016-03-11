// Setup
const namespace = 'oacp'
const Oacp = require('./../index')
var app = new Oacp(namespace)
const PG = require('./helpers/_pg')
const assert = require('assert')
const jwt = require('./helpers/_secrets.json').token
const requester = require('./helpers/_requester')(jwt)

// Tests
describe('Oacp', () => {
  // OACP instance tests
  describe('app', () =>
    it('should be instance of Oacp', () =>
      assert.equal(app.constructor.name, 'Oacp')
    )
  )
  describe('app.config.logger', () => {
    it('should be instance of Logger', () =>
      assert.equal(app.config.logger.constructor.name, 'Logger')
    )
  })
  describe('app.config.app.namespace', () => {
    it('should equal namespace', () =>
      assert.equal(app.config.app.namespace, namespace)
    )
  })
  describe('app.server.http', () => {
    it('should be instance of HTTPServer', () =>
      assert.equal(app.server.http.constructor.name, 'HTTPServer')
    )
    it('should inherit from EventEmitter', () =>
      assert(app.server.http.emit instanceof Function)
    )
  })
  describe('app._ns', () =>
    it('should equal namespace', () =>
      assert.equal(app._ns, namespace)
    )
  )
  // Model class and instance tests
  const UserModel = app.registerModel('User')
  describe('app.registerModel(\'User\')', () => {
    it('should extend Record on User', () =>
      assert(UserModel.find instanceof Function)
    )
    it('should set app.models.User to User', () =>
      assert.equal(app.models.User.name, UserModel.name)
    )
  })
  describe('User.new()', () => {
    var user = UserModel.new()
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
  // Channel instance tests
  var userChannel = app.registerChannel('User')
  describe('userChannel = app.registerChannel(\'User\')', () => {
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
  // Simple route tests
  describe('route [GET]: /user/_validate', () => {
    var result = false
    beforeEach(function getRequest (done) {
      requester('validate', false, (err, data) => {
        result = !err && (data.toString() === 'true')
        done(err)
      })
    })
    it('should return true', () => assert(result))
  })
  describe('route [GET]: /user/1, no token', () => {
    var result = false
    beforeEach(function getRequest (done) {
      requester('read', false, (err, data, statusCode) => {
        result = !err && (statusCode === 401)
        done(err)
      })
    })
    it('should return 401 status', () => assert(result))
  })
  // Controller instance tests
  var whitelist = ['userid', 'username']
  var userController = app.registerController('User', {whitelist})
  userController.readRules = ['isAdmin']
  var ucd = 'userController = app.registerController(\'User\', whitelist)'
  describe(ucd, () => {
    it('should be instance of User::Channel', () =>
      assert.equal(userController.constructor.name, 'User')
    )
    it('should inherit from Controller', () =>
      assert(userController._listen instanceof Function)
    )
    it('should inherit from EventEmitter', () =>
      assert(userController.emit instanceof Function)
    )
  })
  describe('userController.constructor', () => {
    it('should have \'username\' in whitelist', () =>
      assert(userController.constructor.whitelist.indexOf('username') >= 0)
    )
  })
  // Workflow tests with mock PG calls
  UserModel.PG = PG
  describe('route [GET]: /user/1', () => {
    var result = false
    beforeEach(function getRequest (done) {
      requester('read', true, (err, data) => {
        result = !err && (JSON.parse(data.toString()).data.some_int === 123)
        done(err)
      })
    })
    it('should return data.some_int equal to 123', () => assert(result))
  })
})
