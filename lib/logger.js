// Setup
const fs = require('fs')
const path = require('path')

// Exports
module.exports = Logger

function Logger (opts) {
  var self = this
  self.logfile = path.join(opts.logBase, opts.appName + today() + '.json')
  if (!opts || opts.toConsole) self.toConsole = true
  if (opts && opts.toFile && opts.toFile !== false) self.toFile = true
  if (opts) self.logLevel = opts.logLevel || 'fatal'
}

Logger.prototype.logIt = function (err, level) {
  var self = this
  if (levelToInt(level) > levelToInt(self.logLevel)) return
  var log = {}
  log.time = Date.now()
  log.level = level
  if (typeof err === 'string') log.message = err
  else {
    if (err.name) log.name = err.name
    if (err.message) log.message = err.message
    if (err.fileName) log.fileName = err.fileName
    if (err.lineNumber) log.lineNumber = err.lineNumber
    if (err.stack) log.stack = err.stack
    if (err.meta) log.meta = err.meta
  }
  if (!log.name && !log.message) log.message = err
  if (self.toFile) {
    try {
      var logs = require(self.logfile)
    } catch (e) {
      logs = []
    }
    logs.push(log)
    try {
      fs.writeFileSync(self.logfile, JSON.stringify(logs))
    } catch (e) {
      console.error(e)
    }
  }
  if (!self.toConsole) return
  var logText = level.toUpperCase() + ':'
  if (typeof log.message === 'object') return console.log(log.message)
  if (log.name) logText += '\nName: ' + log.name
  if (log.message) logText += '\nMessage: ' + log.message
  if (log.fileName) logText += '\nFilename: ' + log.fileName
  if (log.lineNumber) logText += '\nLine Number: ' + log.lineNumber
  if (log.stack) logText += '\nStack:\n' + log.stack
  if (log.meta) logText += '\nMeta:\n' + JSON.stringify(log.meta)
  logText += '\n'
  switch (level) {
    case 'info': return console.info(logText)
    case 'warn': return console.warn(logText)
    case 'fatal': return console.error(logText)
    default: return console.log(logText)
  }
}

Logger.prototype.debug = function (err) { return this.logIt(err, 'debug') }
Logger.prototype.info = function (err) { return this.logIt(err, 'info') }
Logger.prototype.warn = function (err) { return this.logIt(err, 'warn') }
Logger.prototype.fatal = function (err) { return this.logIt(err, 'fatal') }

// Helpers
function today () {
  var d = new Date()
  return (d.getMonth() + 1) + '_' + (d.getDate()) + '_' + (d.getFullYear())
}

function levelToInt (level) {
  switch (level) {
    case 'info': return 1
    case 'warn': return 2
    case 'fatal': return 3
    default: return 0
  }
}
