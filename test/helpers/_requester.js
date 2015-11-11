// Setup
const http = require('http')
var jwt

// Exports
module.exports = (token) => {
  jwt = token
  return Requester
}

function Requester (action, token, cb) {
  var method, path, body
  switch (action) {
    case 'validate':
      method = 'GET'
      path = '/_validate'
      break
    case 'search':
      method = 'GET'
      break
    case 'create':
      method = 'POST'
      body = {userid: 1, username: 'jerry'}
      break
    case 'read':
      method = 'GET'
      path = '/1'
      break
    case 'update':
      method = 'PUT'
      path = '/1'
      body = {userid: 1, username: 'gerald'}
      break
    case 'delete':
      method = 'DELETE'
      break
  }
  var options = {
    hostname: 'localhost',
    port: 8080,
    path: '/user' + (path || ''),
    method: method,
    headers: {
      'Content-Type': 'application/json'
    }
  }
  if (token) options.headers.Authorization = 'Bearer ' + jwt
  if (body) options.headers['Content-Length'] = JSON.stringify(body).length

  var req = http.request(options, (res) => {
    var out = ''
    res.on('data', (chunk) => {
      out += chunk.toString()
    })
    res.on('end', () => {
      cb(null, out, res.statusCode)
    })
  })

  req.on('error', (e) => cb(e, null, 500))

  if (body) req.write(JSON.stringify(body))
  req.end()
}
