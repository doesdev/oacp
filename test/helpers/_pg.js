// Setup
const util = require('util')
const Event = require('events').EventEmitter

// Exports
module.exports = PG

function PG () {
  var self = this
  setTimeout(() => self.emit('ready'), 0)
  return self
}

util.inherits(PG, Event)

PG.prototype.sp = function (name, params) {
  // name should look like oacp_member_read
  // params should look like [ { id_array: [ 7 ] } ]
  var self = this
  var row = {}
  var data = {some_field: 'some_value', some_int: 123}
  var output = {
    command: 'SELECT',
    rowCount: 1,
    oid: NaN,
    rows: [],
    fields:
     [ { name: name,
         tableID: 0,
         columnID: 0,
         dataTypeID: 3802,
         dataTypeSize: -1,
         dataTypeModifier: -1,
         format: 'text' } ],
    _parsers: [() => true],
    RowCtor: () => true,
    rowAsArray: false,
    _getTypeParser: () => true
  }
  if (name.match(/error/)) return self.emit('error', new Error('Some PG error'))
  if (name.match(/empty/)) return self.emit('data', output)
  row[name] = (name.match(/array/)) ? [data, data, data] : [data]
  output.rows[0] = row
  self.emit('data', output)
}
