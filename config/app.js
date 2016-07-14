// Setup
const path = require('path')
const appRoot = process.cwd()
const Logger = require('./../lib/logger')
const fs = require('fs')
const info = require(path.join(appRoot, 'package.json'))
const oacpConf = info.oacp || {jwt: {}, env: {}}
const accessPath = oacpConf.access || 'helpers/access.js'

// Export config
module.exports = function (ns) {
  var config = {app: {}, jwt: {}}
  config.env = oacpConf.env
  Object.keys(process.env).forEach((k) => { config.env[k] = process.env[k] })
  config.appRoot = appRoot
  config.configPath = path.join(appRoot, 'config')
  config.secrets = require(path.join(config.configPath, 'secrets.json'))
  config.jwt = oacpConf.jwt
  config.jwt.secret = (config.secrets.jwt || {}).secret || config.jwt.secret
  config.app.name = info.name
  config.app.ns = config.app.namespace = (ns || oacpConf.namespace || info.name)
    .replace(/\.?([A-Z]+)/g, (x, y) => (' ' + y)).trim()
    .replace(/\s+|[,-;\[\]\\\/]/g, '_').toLowerCase()
  config.app.version = info.version
  const privKeyPath = oacpConf.jwt.privKeyPath ||
    path.join(config.configPath, config.app.ns + '.priv')
  try {
    config.privKey = fs.readFileSync(privKeyPath)
  } catch (e) {}
  const pubKeyPath = oacpConf.jwt.pubKeyPath ||
    path.join(config.configPath, config.app.ns + '.pub')
  try {
    config.pubKey = fs.readFileSync(pubKeyPath)
  } catch (e) {
    delete config.privKey
    delete config.pubKey
  }

  var loggerOpts = {
    appName: config.app.ns,
    toConsole: true,
    toFile: true,
    loglevel: 'debug',
    logBase: path.join(appRoot, 'logs')
  }
  createDir(loggerOpts.logBase)
  config.logger = new Logger(loggerOpts)
  try {
    config.access = require(path.join(appRoot, accessPath))
  } catch (e) {
    config.access = {allow: () => true}
  }
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
