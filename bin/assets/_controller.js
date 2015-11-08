// Initialize controller extenstions
module.exports = function (controller) {
  // Access control rules
  const coreRules = ['isAdmin', 'isOwner']
  controller.searchRules = coreRules
  controller.createRules = coreRules
  controller.readRules = ['unrestricted']
  controller.updateRules = coreRules
  controller.deleteRules = coreRules

  /* CONTROLLER ACTION HOOKS AND OVERRIDES */
  // Override final Handling of Read action
  controller.read = function (req, res, record) {
    var self = this
    // Change some attribute of record and then emit response
    record.attrs.someAttribute = '47'
    self.emit('json-body', req, res, record.attrs)
  }
}
