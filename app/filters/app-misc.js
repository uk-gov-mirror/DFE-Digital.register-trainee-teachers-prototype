// -------------------------------------------------------------------
// Imports and setup
// -------------------------------------------------------------------

// Leave this filters line
var filters = {}

// Return firstname + lastname
filters.getShortName = ({
  givenName="", 
  familyName=""} = false) => {
  let names = []
  names.push(givenName)
  names.push(familyName)
  return names.filter(Boolean).join(' ')
}

// Return full name with middle names if present
filters.getFullName = ({
  givenName="", 
  middleNames="", 
  familyName=""} = false) => {
  let names = []
  names.push(givenName)
  names.push(middleNames)
  names.push(familyName)
  return names.filter(Boolean).join(' ')
}

// -------------------------------------------------------------------
// keep the following line to return your filters to the app
// -------------------------------------------------------------------
exports.filters = filters
