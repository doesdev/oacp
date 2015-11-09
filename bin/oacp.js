#!/usr/bin/env node

// Todo
// - Add OACP global config command ('config')
// - Add RSA pair generator command for current API ('keygen')
// - Add datbase config command for current API ('config-db')

// Setup
const currentDir = process.cwd()
const cli = require('commander')
const path = require('path')
const fs = require('fs')
const info = require('./../package.json')
const readline = require('readline')
const assets = path.resolve(__dirname, 'assets')
const bpIndex = fs.readFileSync(path.join(assets, '_index.js')).toString()
const bpContr = fs.readFileSync(path.join(assets, '_controller.js')).toString()
const bpWl = fs.readFileSync(path.join(assets, '_whitelist.js')).toString()
var bpApiIndex = fs.readFileSync(path.join(assets, '_api_index.js')).toString()
var bpPackage = fs.readFileSync(path.join(assets, '_package.json')).toString()

// Helpers
const toArray = (str) => (str.split(',').map((e) => e.trim()))
// Helper function for name dependent properties
function named (opts) {
  opts.namespace = opts.name
    .replace(/\.?([A-Z]+)/g, (x, y) => (' ' + y)).trim()
    .replace(/\s+|[,-;\[\]\\\/]/g, '_').toLowerCase()
  opts.dir = path.join(currentDir, opts.name)
}

// CLI application
cli.version(info.version)
  // Command: [new] New OACP API
  .command('new [apiName] [resourceNames...]')
  .description('Create new OACP API, scaffold out each resource by name')
  .option('-i, --interactive', 'Create API interactively')
  .option('-d, --dir <apiDir>', 'API directory')
  .option(
    '-s, --scaffold <resourceNames>',
    'Comma separated list of resources to scaffold',
    toArray
  )
  .action(newApi)

// Initialize CLI
cli.parse(process.argv)

// Initialize our new API
function newApi (apiName, resourceNames, options) {
  var name = apiName || options.name
  var scaffold = resourceNames || options.scaffold
  name = (typeof name === 'function') ? null : name
  scaffold = (typeof scaffold === 'function') ? null : scaffold
  var opts = {
    name: name,
    scaffold: scaffold,
    dir: null,
    namespace: null
  }
  if (options.interactive) return apiPrompts(opts, createApi)
  named(opts)
  createApi(opts)
}

// Interactively set variables for new API
function apiPrompts (opts, cb) {
  const reader = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  // Steps for the prompts to walk through
  var steps = [
    {
      prompt: () => (
        console.log('====================') &
        console.log('What is your API\'s name going to be?\n') &
        console.log('Name: (' + (opts.name || '') + ') [Required Field]')
      ),
      required: true,
      variable: 'name',
      callback: () => named(opts)
    },
    {
      prompt: () => (
        console.log('====================') &
        console.log('What should the namespace be?\n') &
        console.log('note: this will be used in your PG functions') &
        console.log('i.e. namespace_resource_action(jsonb)\n') &
        console.log('Namespace: (' + opts.namespace + ')')
      ),
      variable: 'namespace'
    },
    {
      prompt: () => (
        console.log('====================') &
        console.log('What directory do you want your API in?\n') &
        console.log('Directory: (' + opts.dir + ')')
      ),
      variable: 'dir'
    },
    {
      prompt: () => (
        console.log('What resources do you want to scaffold out?\n') &
        console.log('note: comma separated list of resource names\n') &
        console.log('Scaffold: (' + opts.scaffold + ')')
      ),
      variable: 'scaffold',
      callback: () => (opts.scaffold = toArray(opts.scaffold))
    }
  ]
  // Track active step
  var curStep = 0
  // Setup prompt
  console.log('\n\n\x1b[32mWe\'re setting up your new OACP API\x1b[0m\n')
  console.log('Just a few questions before we get started...')
  console.log(' - current value for each (if any) is in parenthesis')
  console.log(' - to change it type the desired value in the prompt')
  console.log(' - simply press `Enter` to accept the current value...\n')
  reader.setPrompt('OACP> ')
  // Process each prompt
  reader.on('SIGINT', () => process.exit(0))
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
    if (!steps[curStep]) {
      reader.close()
      return cb(opts)
    }
    steps[curStep].prompt()
    reader.prompt()
  })
  // Start prompts
  steps[0].prompt()
  reader.prompt()
}

// Create new API
function createApi (opts) {
  // Prepare scaffold
  opts.scaffold = opts.scaffold.map((s) => s
    .replace(/\.?([A-Z]+)/g, (x, y) => (' ' + y)).trim()
    .replace(/\s+|[,-;\[\]\\\/]/g, '_').toLowerCase())
  var scaffoldCamel = opts.scaffold.map((s) => s
    .replace(/^./, s[0].toUpperCase())
    .replace(/(\_\w)/g, (m) => m[1].toUpperCase())
  )
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
  process.exit(0)
}
