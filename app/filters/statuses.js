// -------------------------------------------------------------------
// Imports and setup
// -------------------------------------------------------------------

// Leave this filters line
var filters = {}
const _ = require('lodash')

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

filters.getStatusText = function(data = {}, defaultNotStarted, defaultInProgress) {
  if (!data) return defaultNotStarted || "Not started"
  if (data.status) return data.status
  else return defaultInProgress || "In progress"
}

filters.getStatusClass = (status) => {
  switch (status) {
    // States that currently use the default tag style
    // - 'Enrolled'
    // - 'Conditions met'
    // - 'Conditions not met'
    // - 'Completed'

    // Application phases
    case 'Not started':
      return 'govuk-tag--grey'
    case 'Review':
      return 'govuk-tag--pink'
    case 'In progress':
      return 'govuk-tag--grey'
    case 'Completed':
      return 'govuk-tag--blue'

    // Record statuses
    case 'Draft':
      return 'govuk-tag--grey'
    case 'Apply draft': // same as draft
      return 'govuk-tag--grey'
    case 'Pending TRN':
      return 'govuk-tag--turquoise'
    case 'TRN received':
      return 'govuk-tag--blue'
    case 'EYTS recommended':
      return 'govuk-tag--purple'
    case 'EYTS awarded':
      return
    case 'QTS recommended':
      return 'govuk-tag--purple'
    case 'QTS awarded':
      return
    case 'Deferred':
      return 'govuk-tag--yellow'
    case 'Withdrawn':
      return 'govuk-tag--red'
    case 'Apply':
      return 'govuk-tag--pink'
    case 'Manual':
      return 'govuk-tag--grey'
    default:
      return 'govuk-tag--blue'
  }
}

filters.sectionIsInProgress = data =>{
  return (data)
}

filters.sectionIsCompleted = data =>{
  let status = data?.status
  // if (status == "Completed" || status == "Review") return true
  if (status == "Completed") return true
  else return false
}

filters.reviewIfInProgress = (url, data, path) => {
  if (!filters.sectionIsInProgress(data)){
    return url
  }
  else {
    if (path) return path + '/confirm'
    else return url + "/confirm"
  }
}


/*
This is filter patches in the ability to highlight rows on a summary list which
contain invalid answers. 

We indicate invalid answers by prefacing them with the string **invalid**

This filter loops through each row, looking for this string in value.html or value.text.
If found, it adds some classes and messaging, and moves the action link within the value.

It also pushes the name of the row with the error to a temporary array stored
in the Nunjucks context. This is a hacky way that we can get a list of each of the 
errors visible in a set of summary lists without knowing about the data structure of a
record. The very act of running this filter on each summary list builds up this array.
We can then use that array to display a summary at the top of the page. This is combined
with a catch all route (*) that wipes the array with each request - so it should only
have items found since the last request.

This is very hacky - but works. It avoids us needing to know much about the data
or program errors per field. We just reivew the summary list to decide if something
is wrong.
*/

// Must be classic function as arrow functions don't provide the Nunjucks context
filters.highlightInvalidRows = function(rows) {
  let ctx = Object.assign({}, this.ctx)

  // We need to add to any existing answers from previous times
  // this filter has run on this page
  let invalidAnswers = ctx.data?.record?.invalidAnswers || []

  if (rows) {
    rows.map(row => {

      // Values are stored two possible places
      let value = row?.value?.html || row?.value?.text

      // We preface invalid answers with **invalid** but technically it sohuld work anywhere
      // Probably might not work for dates / values that get transformed before display
      if (value && value.includes('**invalid**') ){

        // Keys are stored two possible places
        let key = row?.key?.html || row?.key?.text

        // Generate an id so we can anchor to this row
        let id = `summary-list--row-invalid-${invalidAnswers.length + 1}`

        // GOVUK summary lists don’t support setting an id on rows
        // so we wrap the key in a div with our own id
        row.key.html = `<div id="${id}">${key}</div>`

        // Store the row name so it can be used in a summary at 
        // the top of the page
        invalidAnswers.push({name: key, id})
        
        // Error message that gets shown
        let messageContent = `${key} is not recognised`
        let messageHtml = `<p class="govuk-body app-summary-list__message--invalid govuk-!-margin-bottom-2">${messageContent}</p>`

        // Grab the existing action link and craft a new link
        let linkHtml = '' // default to no link
        let actionItems = row?.actions?.items

        // If there’s more than one link (unlikely), do nothing
        if (actionItems && actionItems.length == 1){
          let href = row?.actions?.items[0].href
          linkHtml = `<br><a class="govuk-link govuk-link--no-visited-state" href="${href}">
          Review the trainee’s answer<span class="govuk-visually-hidden"> for ${key.toLowerCase()}</span>
          </a>`
          delete row.actions.items
        }
      
        // Add a class to the row so we can target it
        row.classes = `${row.classes} app-summary-list__row--invalid`

        // Strip **invalid** so it doesn’t display
        let userValue = value.replace("**invalid**", "")

        // Wrap in a div for styling
        let userValueHtml = `<div class="app-summary-list__user-value">${userValue}</div>`

        // Entire thing is wrapped in a div so we can style a left border within the padding of the
        // summary list value box
        row.value.html = `<div class="app-summary-list__value-inset">${messageHtml}${userValueHtml}${linkHtml}</div>`

        // Source value might have been stored in text - delete just in case
        delete row.value?.text

        // Key will get saved to key.html, so we don’t need  key.text any more
        delete row.key?.text

      }
      return row
    })
  }

  // Unique our invalid answers just in case
  invalidAnswers = [...new Set(invalidAnswers)] 

  // Save array back to context
  // using lodash on the rare chance record doesn’t acutally exist yet
  if (invalidAnswers.length){
    _.set(this.ctx, 'data.record.invalidAnswers', invalidAnswers)
  }
  return rows
}

filters.captureInvalid = function(data){
  let ctx = Object.assign({}, this.ctx)

  delete this.ctx.data?.temp?.invalidString // just in case

  if (data.value && data.value.includes("**invalid**")){
    // data.value = data.value.replace("**invalid**", "")
    _.set(this.ctx, 'data.temp.invalidString', data.value)
    data.value = ""
  }
  return data
}

filters.canBeAmmended = status => {
  let statusesThatCanAmend = [
    'Draft',
    'Apply draft',
    'Pending TRN',
    'TRN received',
    'Deferred'
  ]
  return statusesThatCanAmend.includes(status)
}

filters.getCanRecommendForQts = status => {
  let statusesThatShowQtsTabs = [
    'TRN received'
  ]
  return statusesThatShowQtsTabs.includes(status)
}

filters.getCanDefer = status => {
  let statusesThatAllowDeferral = [
    'Pending TRN',
    'TRN received'
  ]
  return statusesThatAllowDeferral.includes(status)
}

filters.getCanReinstate = status => {
  let statusesThatAllowReinstating = [
    'Deferred'
  ]
  return statusesThatAllowReinstating.includes(status)
}

// -------------------------------------------------------------------
// keep the following line to return your filters to the app
// -------------------------------------------------------------------
exports.filters = filters
