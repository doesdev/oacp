// Setup
const currentDir = process.cwd()
const path = require('path')
const fs = require('fs')
const assets = path.resolve(__dirname, 'assets')
const bpIndex = fs.readFileSync(path.join(assets, '_index.js')).toString()
const bpContr = fs.readFileSync(path.join(assets, '_controller.js')).toString()
const bpWl = fs.readFileSync(path.join(assets, '_whitelist.js')).toString()
var bpApiIndex = fs.readFileSync(path.join(assets, '_api_index.js')).toString()
var bpPackage = fs.readFileSync(path.join(assets, '_package.json')).toString()

// Process arguments
const args = process.argv.slice(2)
var name = 'nameless-app'
var scaffold = ['resource']
var namespace, dir
args.forEach(function (a, i) {
  function is (v1, v2) { return !!(a === v1 || a === v2) }
  var prev = args[i - 1]
  var next = args[i + 1]
  if (is('-n', '--name')) return (name = (next || name))
  if (is('-ns', '--namespace')) return (namespace = next)
  if (is('-s', '--scaffold')) return (scaffold = (next.split(',') || scaffold))
  if (is('-d', '--dir')) return (dir = path.resolve(next))
  if (i === 0) return (name = a)
  if (i === 1 && prev[0] !== '-') return (scaffold = a.split(','))
})
namespace = namespace || (name
  .replace(/\.?([A-Z]+)/g, (x, y) => (' ' + y)).trim()
  .replace(/\s+|[,-;\[\]\\\/]/g, '_').toLowerCase())
dir = dir || path.join(currentDir, name)
scaffold = scaffold.map((s) => s
  .replace(/\.?([A-Z]+)/g, (x, y) => (' ' + y)).trim()
  .replace(/\s+|[,-;\[\]\\\/]/g, '_').toLowerCase())
var scaffoldCamel = scaffold.map((s) => s
  .replace(/^./, s[0].toUpperCase())
  .replace(/(\_\w)/g, (m) => m[1].toUpperCase())
)

// Create directory structure
var dirException = 'Error creating directory, stopping app generation'
try {
  fs.mkdirSync(dir)
} catch (e) {
  if (e.code !== 'EEXIST') {
    console.log(dirException, e)
    throw e
  }
}
try {
  fs.mkdirSync(path.join(dir, 'api'))
} catch (e) {
  if (e.code !== 'EEXIST') {
    console.log(dirException, e)
    throw e
  }
}
try {
  fs.mkdirSync(path.join(dir, 'config'))
} catch (e) {
  if (e.code !== 'EEXIST') {
    console.log(dirException, e)
    throw e
  }
}
try {
  fs.mkdirSync(path.join(dir, 'helpers'))
} catch (e) {
  if (e.code !== 'EEXIST') {
    console.log(dirException, e)
    throw e
  }
}
try {
  fs.mkdirSync(path.join(dir, 'test'))
} catch (e) {
  if (e.code !== 'EEXIST') {
    console.log(dirException, e)
    throw e
  }
}
scaffold.forEach(function (s) {
  try {
    fs.mkdirSync(path.join(dir, 'api', s))
  } catch (e) {
    if (e.code !== 'EEXIST') {
      console.log(dirException, e)
      throw e
    }
  }
})

// Write package.json
bpPackage = bpPackage.replace(/\{\{name\}\}/g, name)
bpPackage = bpPackage.replace(/\{\{namespace\}\}/g, namespace)
fs.writeFileSync(path.join(dir, 'package.json'), bpPackage)

// Write index.js
fs.writeFileSync(path.join(dir, 'index.js'), bpIndex)

// Write api/index.js
var regModels = ''
var regChannels = ''
var regControllers = ''
scaffoldCamel.forEach(function (s) {
  regModels += 'app.registerModel(\'' + s + '\')\n'
  regChannels += 'app.registerChannel(\'' + s + '\')\n'
  regControllers += 'app.registerController(\'' + s +
    '\', require(\'./' + s + '/whitelist\'))\n'
})
regModels = regModels.replace(/\n$/, '')
regChannels = regChannels.replace(/\n$/, '')
regControllers = regControllers.replace(/\n$/, '')
bpApiIndex = bpApiIndex.replace(/'\{\{regModels\}\}'/g, regModels)
bpApiIndex = bpApiIndex.replace(/'\{\{regChannels\}\}'/g, regChannels)
bpApiIndex = bpApiIndex.replace(/'\{\{regControllers\}\}'/g, regControllers)
fs.writeFileSync(path.join(dir, 'api', 'index.js'), bpApiIndex)

// Write api/resource/[controller.js, whitelist.js]
scaffold.forEach(function (s) {
  fs.writeFileSync(path.join(dir, 'api', s, 'controller.js'), bpContr)
  fs.writeFileSync(path.join(dir, 'api', s, 'whitelist.js'), bpWl)
})

// Doneskie
console.log('\x1b[32m New project is live in ' + dir + ' \x1b[0m ')
