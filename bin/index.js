// Setup
const currentDir = process.cwd()
const path = require('path')
const fs = require('fs')
const readline = require('readline')
const reader = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})
const assets = path.resolve(__dirname, 'assets')
const bpIndex = fs.readFileSync(path.join(assets, '_index.js')).toString()
const bpContr = fs.readFileSync(path.join(assets, '_controller.js')).toString()
const bpWl = fs.readFileSync(path.join(assets, '_whitelist.js')).toString()
var bpApiIndex = fs.readFileSync(path.join(assets, '_api_index.js')).toString()
var bpPackage = fs.readFileSync(path.join(assets, '_package.json')).toString()
var opts = {name: '', namespace: '', dir: '', scaffold: ['resource']}

// Process name dependent opts
function named () {
  opts.namespace = opts.name
    .replace(/\.?([A-Z]+)/g, (x, y) => (' ' + y)).trim()
    .replace(/\s+|[,-;\[\]\\\/]/g, '_').toLowerCase()
  opts.dir = path.join(currentDir, opts.name)
}

// Process arguments
const args = process.argv.slice(2)
args.forEach(function (a, i) {
  function is (v1, v2) { return !!(a === v1 || a === v2) }
  var prev = args[i - 1]
  var next = args[i + 1]
  if (is('-n', '--name')) {
    (opts.name = next)
    return named()
  }
  if (is('-ns', '--namespace')) return (opts.namespace = next)
  if (is('-s', '--scaffold')) return (opts.scaffold = next.split(','))
  if (is('-d', '--dir')) return (opts.dir = path.resolve(next))
  if (i === 0) {
    (opts.name = a)
    named()
  }
  if (i === 1 && prev[0] !== '-') return (opts.scaffold = a.split(','))
})

var steps = [
  {
    prompt: () => console.log('[app] Name: (' + opts.name + ')'),
    required: true,
    variable: 'name',
    callback: named
  },
  {
    prompt: () => console.log('[app] Namespace: (' + opts.namespace + ')'),
    required: false,
    variable: 'namespace'
  },
  {
    prompt: () => console.log('[app] Directory: (' + opts.dir + ')'),
    required: false,
    variable: 'dir'
  },
  {
    prompt: () => console.log('[app] Scaffold: (' + opts.scaffold + ')'),
    required: false,
    variable: 'scaffold'
  }
]
var curStep = 0

console.log('\nTell us about the new app...\n')
reader.setPrompt('OACP> ')

reader.on('line', function (line) {
  if (
    line.trim() === '' &&
    steps[curStep].required &&
    !opts[steps[curStep].variable]
  ) {
    console.error('\x1b[33mField required \x1b[0m ')
    steps[0].prompt()
    return reader.prompt()
  }
  if (line.trim() !== '') opts[steps[curStep].variable] = line
  if (steps[curStep].callback) steps[curStep].callback()
  curStep = curStep + 1
  if (!steps[curStep]) return finish()
  steps[curStep].prompt()
  reader.prompt()
}).on('close', () => process.exit(0))

steps[0].prompt()
reader.prompt()

opts.scaffold = opts.scaffold.map((s) => s
  .replace(/\.?([A-Z]+)/g, (x, y) => (' ' + y)).trim()
  .replace(/\s+|[,-;\[\]\\\/]/g, '_').toLowerCase())
var scaffoldCamel = opts.scaffold.map((s) => s
  .replace(/^./, s[0].toUpperCase())
  .replace(/(\_\w)/g, (m) => m[1].toUpperCase())
)

function finish () {
  // Create directory structure
  var dirException = 'Error creating directory, stopping app generation'
  try {
    fs.mkdirSync(opts.dir)
  } catch (e) {
    if (e.code !== 'EEXIST') {
      console.log(dirException, e)
      throw e
    }
  }
  try {
    fs.mkdirSync(path.join(opts.dir, 'api'))
  } catch (e) {
    if (e.code !== 'EEXIST') {
      console.log(dirException, e)
      throw e
    }
  }
  try {
    fs.mkdirSync(path.join(opts.dir, 'config'))
  } catch (e) {
    if (e.code !== 'EEXIST') {
      console.log(dirException, e)
      throw e
    }
  }
  try {
    fs.mkdirSync(path.join(opts.dir, 'helpers'))
  } catch (e) {
    if (e.code !== 'EEXIST') {
      console.log(dirException, e)
      throw e
    }
  }
  try {
    fs.mkdirSync(path.join(opts.dir, 'test'))
  } catch (e) {
    if (e.code !== 'EEXIST') {
      console.log(dirException, e)
      throw e
    }
  }
  opts.scaffold.forEach(function (s) {
    try {
      fs.mkdirSync(path.join(opts.dir, 'api', s))
    } catch (e) {
      if (e.code !== 'EEXIST') {
        console.log(dirException, e)
        throw e
      }
    }
  })

  // Write package.json
  bpPackage = bpPackage.replace(/\{\{name\}\}/g, opts.name)
  bpPackage = bpPackage.replace(/\{\{namespace\}\}/g, opts.namespace)
  fs.writeFileSync(path.join(opts.dir, 'package.json'), bpPackage)

  // Write index.js
  fs.writeFileSync(path.join(opts.dir, 'index.js'), bpIndex)

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
  fs.writeFileSync(path.join(opts.dir, 'api', 'index.js'), bpApiIndex)

  // Write api/resource/[controller.js, whitelist.js]
  opts.scaffold.forEach(function (s) {
    fs.writeFileSync(path.join(opts.dir, 'api', s, 'controller.js'), bpContr)
    fs.writeFileSync(path.join(opts.dir, 'api', s, 'whitelist.js'), bpWl)
  })

  // Doneskie
  console.log('\n\x1b[32mNew project is live in ' + opts.dir + ' \x1b[0m ')
  reader.close()
  process.exit(0)
}
