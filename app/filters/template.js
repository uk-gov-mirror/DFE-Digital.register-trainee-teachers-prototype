// -------------------------------------------------------------------
// Imports and setup
// -------------------------------------------------------------------

// Leave this filters line
var filters = {}


/*
  ====================================================================
  filterName
  --------------------------------------------------------------------
  Short description for the filter
  ====================================================================

  Usage:

  [Usage here]

  filters.sayHi = (name) => {
    return 'Hi ' + name + '!'
  }

*/

filters.getStatusesForQtsTabs = status => {
  let statusesThatShowQtsTabs = [
    'TRN received',
    'Pending QTS',
    'Deferred',
    'Withdrawn'
  ]
  return statusesThatShowQtsTabs.includes(status)
}


// -------------------------------------------------------------------
// keep the following line to return your filters to the app
// -------------------------------------------------------------------
exports.filters = filters
