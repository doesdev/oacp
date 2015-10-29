// Setup
const path = require('path')
const appRoot = require('app-root-path').toString()
const Logger = require('./../lib/logger')
const fs = require('fs')
const info = require(path.join(appRoot, 'package.json'))
var config = {app: {}}
config.app.name = info.name
config.app.ns = config.app.namespace = (info.namespace || info.name)
  .replace(/\.?([A-Z]+)/g, (x, y) => (' ' + y)).trim()
  .replace(/\s+/g, '_').toLowerCase()
config.app.version = info.version
const privKeyPath = path.join(appRoot, 'config', config.app.ns + '.priv')
try {
  config.privKey = fs.readFileSync(privKeyPath)
} catch (e) {}
const pubKeyPath = path.join(appRoot, 'config', config.app.ns + '.pub')
try {
  config.pubKey = fs.readFileSync(pubKeyPath)
} catch (e) {}

var loggerOpts = {
  appName: info.name,
  toConsole: true,
  toFile: true,
  loglevel: 'debug',
  logBase: path.join(appRoot, 'logs')
}
createDir(loggerOpts.logBase)
config.logger = new Logger(loggerOpts)

module.exports = config

// Helpers
function createDir (dir) {
  fs.mkdir(dir, function (e) {
    if (e && e.code === 'EEXIST') return
    if (e) console.error(e)
    return
  })
}
