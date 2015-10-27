// Initialize channel servers
var server = {}
const HTTPServer = require('./channels/http_server')
server.http = new HTTPServer()

// Exports
module.exports = server
