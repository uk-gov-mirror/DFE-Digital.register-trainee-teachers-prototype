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

  // Flush data when starting bulk action flow from the start
  router.get('/bulk-action/new', (req, res) => {
    const data = req.session.data
    delete data.bulk
    res.redirect(`/bulk-action`)
  })

  // TODO: this should be a POST
  router.get('/bulk-action/recommend-for-qts', (req, res) => {
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

  // Needs to provided filtered and selected trainees to view
  router.get('/bulk-action/select-trainees', (req, res) => {
    const data = req.session.data
    let bulk = data.bulk || {}

    let allRecords = recordUtils.sortRecordsByLastName(data.records)
    let filteredRecords

    // Work out which checkboxes should be checked
    // We may want to pre-select checkboxes when landing on this page
    // so we either use the session data or the filtered list
    let selectedTrainees = (bulk?.selectedTrainees) ? bulk.selectedTrainees : []

    // Hardcode a list of trainees
    _.set(bulk, "filteredTrainees", exampleTrainees)

    // Missing filtered trainees - can’t continue
    if (!bulk?.filters && !bulk?.filteredTrainees){
      console.log('Bulk action: no filtered trainees, returning to records')
      res.redirect(`/records`)
    }

    else {

      // Do we already have a filtered list of trainees to work with?
      if (bulk?.filteredTrainees) {
        // Look up records from list
        filteredRecords = recordUtils.getRecordsById(allRecords, bulk.filteredTrainees)
        // If no pre-selected trainees, default to selecting them all
        if (!bulk?.selectedTrainees) selectedTrainees = bulk.filteredTrainees
      }

      // Coming from the filters page
      else if (bulk?.filters){
        filteredRecords = allRecords
        // TODO: do filtering in a function
        filteredRecords = filteredRecords.filter(record => record?.route == "Provider-led")
        // console.log(filteredRecords)
        filteredRecords = filteredRecords.filter(record => record?.status == "TRN received")
        filteredRecords
      }
      res.render(`bulk-action/select-trainees`, {
        filteredRecords, 
        selectedTrainees
      })
    }

  })

  // Bypass date answer if not relevant - eg we already have it, or it's not needed
  router.post('/bulk-action/select-trainees-answer', (req, res) => {
    const bulk = req.session.data.bulk
    if (bulk.date || bulk.action != "Recommend for QTS") res.redirect(`/bulk-action/confirm`)
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
    let records = data.records
    let successCount = 0
    let failCount = 0

    let selectedTraineeIds = bulk.selectedTrainees
    // Look up records
    let selectedRecords = recordUtils.getRecordsById(records, selectedTraineeIds)

    selectedRecords.forEach(record => {
      let success = utils.recommendForQTS(record, {date: bulk.date})
      if (success) successCount++ 
      else failCount++
    })

    console.log(`Bulk action: ${successCount} success, ${failCount} failure.`)

    // Clear data for next time
    delete data.bulk

    req.flash('success', `${successCount} ${filters.pluralise('record', successCount)} submitted for QTS`)
    res.redirect(`/records/`)
  })

}
