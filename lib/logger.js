'use strict'

// Setup
const path = require('path')
const fork = require('child_process').fork
const errProps = [
  'name',
  'message',
  'fileName',
  'lineNumber',
  'stack',
  'meta'
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
let whitelist

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
  whitelist = opts.whitelist
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

function initCap (str) {
  str = str || ''
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`
}

function logIt (err, level) {
  if (levelToInt(level) < levelToInt(logLevel)) return
  if (whitelist) {
    let name = err.name || err.toString()
    if (name && whitelist.indexOf(name) !== -1) return
  }
  let logFilePath = path.join(logBase, `${appName}_${today()}.json`)
  let log = {}
  log.time = Date.now()
  log.level = level
  if (typeof err === 'string') log.message = err
  else {
    Object.assign(log, err)
    errProps.forEach((p) => { if (err[p]) log[p] = err[p] })
  }
  if (!log.name && !log.message) log.message = err
  let logProps = Object.getOwnPropertyNames(log)
  let logText = `${level.toUpperCase()}:`
  logText += `\nTimestamp: ${new Date(log.time).toLocaleString()}`
  logProps.forEach((k) => {
    if (k === 'time' || k === 'level') return
    let val = typeof log[k] === 'object' ? JSON.stringify(log[k]) : log[k]
    logText += `\n${initCap(k)}: ${val}`
  })
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
