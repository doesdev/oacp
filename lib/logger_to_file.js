'use strict'

// Setup
const fs = require('fs')

// Main
process.on('message', (data) => {
  try {
    var logs = require(data.logFilePath)
  } catch (e) {
    logs = []
  }
  logs.push(data.log)
  try {
    fs.writeFileSync(data.logFilePath, JSON.stringify(logs))
  } catch (e) {
    process.send(e)
  }
})
