const _ = require('lodash')
const moment = require('moment')
const path = require('path')
const recordUtils = require('./../lib/record.js')
const url = require('url')
const utils = require('./route-utils')
const filters = require('./../filters.js')()

// Some hardcoded trainees for testing
// Will need to be regenerated if we create new seeds
let exampleTrainees = [
  '6272d7bd-7d6c-4a06-896f-19e5b095917d',
  '08619666-f282-4fb9-a235-8e23dc4e40e5',
  'f886b087-2ebd-452c-9ab1-ec59638fe5c5',
  '99d60780-24af-4b50-9563-78c6bb227362',
  '86e632e9-3c9b-465f-8bb9-37928d13793e',
  '71c6dd59-1fe2-44b6-bbef-14483dbd5cbe',
  'a0657735-eee5-4fb4-9872-6545aea5040c',
  'fd612d5c-fe5d-41f3-8657-319fa361b452',
  '011d7170-b227-478b-8401-369d35cd6b08'
]

module.exports = router => {

  // Flush data when starting bulk action flow from the beginning
  router.get('/bulk-action/new', (req, res) => {
    const data = req.session.data
    delete data.bulk
    res.redirect(`/bulk-action`)
  })

  // Bypass action page 
  router.get('/bulk-action/new/register-for-trn', (req, res) => {
    const data = req.session.data
    // Overwrites existing bulk object
    data.bulk = {
      action: "Register for TRN",
    }
    res.redirect(`/bulk-action/filter-trainees`)
  })

  // Bypass action page
  router.get('/bulk-action/new/recommend-for-qts', (req, res) => {
    const data = req.session.data
    // Overwrites existing bulk object
    data.bulk = {
      action: "Recommend for QTS",
    }
    res.redirect(`/bulk-action/filter-trainees`)
  })

  // TODO: this should be a POST
  router.get('/bulk-action/example', (req, res) => {
    const data = req.session.data

    // Grab list of trainees and delete everything else
    // let filteredTrainees = data?.bulk?.filteredTrainees
    let filteredTrainees = exampleTrainees

    // Overwrites existing bulk object
    data.bulk = {
      filteredTrainees,
      selectedTrainees: filteredTrainees, // preselect all trainees
      action: "Recommend for QTS",
      directAction: true
    }
    res.redirect(`/bulk-action/date`)
  })

  // Needs to provid filtered and selected trainees to view
  router.get('/bulk-action/select-trainees', (req, res) => {
    const data = req.session.data
    const bulk = data.bulk || {}
    const autoSelectTrainees = false // unsure if this is good

    let allRecords = recordUtils.sortRecordsByLastName(data.records)
    let filteredRecords
    let incompleteDraftCount = 0 // Only for QTS flow

    // Work out which checkboxes should be checked
    // We may want to pre-select checkboxes when landing on this page
    // so we either use the session data or the filtered list
    let selectedTrainees = bulk?.selectedTrainees || []

    // Hardcode a list of trainees
    // _.set(bulk, "filteredTrainees", exampleTrainees)

    // Something has gone wrong - can’t continue without an action
    if (!bulk?.action){
      res.redirect('/bulk-action')
    }

    // Missing any filtered trainees or means to filter them - can’t continue
    else if (!bulk?.filters && !bulk?.filteredTrainees){
      console.log('Bulk action: no filtered trainees, returning to records')
      res.redirect(`/records`)
    }

    // Have a group of trainees to show
    else {

      // Have a predefined list of trainees to show
      if (bulk?.filteredTrainees) {

        // Look up records from list
        filteredRecords = recordUtils.getRecordsById(allRecords, bulk.filteredTrainees)

        // If no pre-selected trainees, default to selecting them all
        if (autoSelectTrainees && !bulk?.selectedTrainees) selectedTrainees = bulk.filteredTrainees
      }

      // Coming from the filters page
      else if (bulk?.filters){

        // Create group of records using provided filters
        filteredRecords = utils.filterRecords(allRecords, data, bulk.filters)

        // Filter for only draft records that are complete
        if (bulk.action == 'Register for TRN'){
          filteredRecords = filteredRecords
            .filter(record => record.status == 'Draft')
            .filter(record => {
              if (utils.recordIsComplete(record)) return true
              else {
                incompleteDraftCount++
                return false
              }
            })
        }

        // Filter for only records ready to be recommended for QTS
        else if (bulk.action == 'Recommend for QTS'){
          filteredRecords = filteredRecords.filter(record => record.status == 'TRN received')
        }

        // If no pre-selected trainees, default to selecting them all
        if (autoSelectTrainees && !bulk?.selectedTrainees) selectedTrainees = filteredRecords.map(record => record.id)

      }

      res.render(`bulk-action/select-trainees`, {
        filteredRecords,
        selectedTrainees,
        incompleteDraftCount
      })

    }

  })

  // Bypass date answer if not relevant - eg we already have it, or it's not needed
  router.post('/bulk-action/select-trainees-answer', (req, res) => {
    const bulk = req.session.data.bulk

    // No trainees selected, return to page
    if (!bulk?.selectedTrainees){
      res.redirect(`/bulk-action/select-trainees`)
    }

    // Date not needed, go to confirm
    else if (bulk.date || bulk.action != "Recommend for QTS") res.redirect(`/bulk-action/confirm`)

    // Date answer needed
    else res.redirect(`/bulk-action/date`)
  })

  // Convert date radios to actual dates
  router.post('/bulk-action/date-answer', (req, res) => {
    const data = req.session.data
    const bulk = data.bulk

    // Convert radio choices to real dates
    if (!bulk){
      res.redirect(`/bulk-action/date`)
    }
    else {
      let radioChoice = bulk.dateRadio
      if (radioChoice == "Today") {
        bulk.date = filters.toDateArray(filters.today())
      }
      if (radioChoice == "Yesterday") {
        bulk.date = filters.toDateArray(moment().subtract(1, "days"))
      } 
    }
    
    res.redirect(`/bulk-action/confirm`)
  })

  // Save bulk action
  router.post('/bulk-action/save', (req, res) => {
    const data = req.session.data
    const bulk = data.bulk
    const records = data.records

    let successCount = 0
    let failCount = 0

    // Look up records from IDs
    let selectedRecords = recordUtils.getRecordsById(records, bulk.selectedTrainees)

    // Loop through each record
    selectedRecords.forEach(record => {
      let success = utils.doBulkAction(bulk.action, record, {date: bulk?.date})
      if (success) successCount++ 
      else failCount++
    })

    console.log(`Bulk action: ${successCount} ${filters.pluralise('success', successCount)}, ${failCount} ${filters.pluralise('failure', failCount)}.`)

    // Clear data for next time
    delete data.bulk

    req.flash('success', `${successCount} ${filters.pluralise('record', successCount)} submitted for QTS`)
    res.redirect(`/records/`)
  })

}
