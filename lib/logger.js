'use strict'

// Setup
const path = require('path')
const fork = require('child_process').fork
const errProps = [
  'name',
  'message',
  'fileName',
  'lineNumber',
  'stack'
]
const logger = {
  debug: (err) => logIt(err, 'debug'),
  info: (err) => logIt(err, 'info'),
  warn: (err) => logIt(err, 'warn'),
  fatal: (err) => logIt(err, 'fatal')
}
// Globals
let commitLogToFile = fork(path.join(__dirname, 'logger_to_file.js'))
let appName = 'oacpApp'
let logLevel = 'warn'
let logBase = __dirname
let toConsole = true
let toFile = true
let toDb = false

// Get new fork if this one closes
commitLogToFile.on('close', () => {
  commitLogToFile = fork(path.join(__dirname, 'logger_to_file.js'))
})

// Exports
module.exports = logger
module.exports.setOpts = (opts) => {
  opts = opts || {}
  appName = opts.appName || appName
  logLevel = opts.logLevel || logLevel
  logBase = opts.logBase || logBase
  toConsole = opts.toConsole
  toFile = opts.toFile
  toDb = opts.toDb
}

// Helpers
function today () {
  let d = new Date()
  return (
    `0${d.getMonth() + 1}`.slice(-2) + '_' +
    `0${d.getDate()}`.slice(-2) + '_' +
    d.getFullYear()
  )
}

function levelToInt (level) {
  switch (level) {
    case 'info': return 1
    case 'warn': return 2
    case 'fatal': return 3
    default: return 0
  }
}

function logIt (err, level) {
  if (levelToInt(level) < levelToInt(logLevel)) return
  let logFilePath = path.join(logBase, `${appName}_${today()}.json`)
  let log = {}
  log.time = Date.now()
  log.level = level
  if (typeof err === 'string') log.message = err
  else errProps.forEach((p) => { if (err[p]) log[p] = err[p] })
  if (!log.name && !log.message) log.message = err
  let logText = level.toUpperCase() + ':'
  if (typeof log.message === 'object') return console.log(log.message)
  logText += `\nTimestamp: ${new Date(log.time).toLocaleString()}`
  if (log.name) logText += `\nName: ${log.name}`
  if (log.message) logText += `\nMessage: ${log.message}`
  if (log.fileName) logText += `\nFilename: ${log.fileName}`
  if (log.lineNumber) logText += `\nLine Number: ${log.lineNumber}`
  if (log.stack) logText += `\nStack:\n ${log.stack}`
  logText += '\n'
  if (toFile) {
    try {
      commitLogToFile.send({logFilePath, log})
    } catch (e) {
      commitLogToFile = fork(path.join(__dirname, 'logger_to_file.js'))
    }
  }
  if (toDb) {
    // not implemented
  }
  if (toConsole) {
    switch (level) {
      case 'info': return console.info(logText)
      case 'warn': return console.warn(logText)
      case 'fatal': return console.error(logText)
      default: return console.log(logText)
    }
  }
}
