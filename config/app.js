// Setup
const path = require('path')
const Logger = require('./../lib/logger')
const fs = require('fs')
const info = require('./../package.json')
var config = {app: {}}
config.app.name = info.name
config.app.ns = config.app.namespace = (info.namespace || info.name)
  .replace(/\.?([A-Z]+)/g, (x, y) => (' ' + y)).trim()
  .replace(/\s+/g, '_').toLowerCase()
config.app.version = info.version
const pubKey = fs.readFileSync(path.join(__dirname, config.app.ns + '.pub'))

var loggerOpts = {
  appName: info.name,
  toConsole: true,
  toFile: true,
  loglevel: 'debug',
  logBase: path.join(__dirname, '../', 'logs')
}
createDir(loggerOpts.logBase)
config.logger = new Logger(loggerOpts)
config.pubKey = pubKey

module.exports = config

// Helpers
function createDir (dir) {
  fs.mkdir(dir, function (e) {
    if (e && e.code === 'EEXIST') return
    if (e) console.error(e)
    return
  })
}
