// Setup
const path = require('path')
const appRoot = require('app-root-path').toString()
const Logger = require('./../lib/logger')
const fs = require('fs')
const info = require(path.join(appRoot, 'package.json'))
const oacpConf = info.oacp || {jwt: {}}

// Export config
module.exports = function (ns) {
  var config = {app: {}, jwt: {}}
  config.appRoot = appRoot
  config.configPath = path.join(appRoot, 'config')
  config.secrets = require(path.join(config.configPath, 'secrets.json'))
  config.jwt.issuer = oacpConf.jwt.issuer
  config.app.name = info.name
  config.app.ns = config.app.namespace = (ns || oacpConf.namespace || info.name)
    .replace(/\.?([A-Z]+)/g, (x, y) => (' ' + y)).trim()
    .replace(/\s+/g, '_').toLowerCase()
  config.app.version = info.version
  const privKeyPath = path.join(config.configPath, config.app.ns + '.priv')
  try {
    config.privKey = fs.readFileSync(privKeyPath)
  } catch (e) {}
  const pubKeyPath = path.join(config.configPath, config.app.ns + '.pub')
  config.pubKeyPath = pubKeyPath
  try {
    config.pubKey = fs.readFileSync(pubKeyPath)
  } catch (e) {}

  var loggerOpts = {
    appName: config.app.ns,
    toConsole: true,
    toFile: true,
    loglevel: 'debug',
    logBase: path.join(appRoot, 'logs')
  }
  createDir(loggerOpts.logBase)
  config.logger = new Logger(loggerOpts)
  return config
}

// Helpers
function createDir (dir) {
  fs.mkdir(dir, function (e) {
    if (e && e.code === 'EEXIST') return
    if (e) console.error(e)
    return
  })
}
