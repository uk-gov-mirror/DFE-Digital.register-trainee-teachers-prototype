// -------------------------------------------------------------------
// Imports and setup
// -------------------------------------------------------------------

// Leave this filters line
var filters = {}

// Return firstname + lastname
filters.getShortName = person => {
  let names = []
  if (person.givenName) names.push(person.givenName)
  if (person.familyName) names.push(person.familyName)
  return names.join(' ')
}

// Return full name with middle names if present
filters.getFullName = person => {
  let names = []
  if (person.givenName) names.push(person.givenName)
  if (person.middleNames) names.push(person.middleNames)
  if (person.familyName) names.push(person.familyName)
  return names.join(' ')
}

// -------------------------------------------------------------------
// keep the following line to return your filters to the app
// -------------------------------------------------------------------
exports.filters = filters
