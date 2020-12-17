const faker = require('faker')
const path = require('path')
const moment = require('moment')
const filters = require('./../filters.js')()
const _ = require('lodash')
const trainingRoutes = require('./../data/training-route-data').trainingRoutes


// Return first part of url to use in redirects
exports.getRecordPath = req => {
  let recordType = req.params.recordtype
  return (recordType == 'record') ? (`/record/${req.params.uuid}`) : '/new-record'
}

// Delete temporary stores of data
exports.deleteTempData = (data) => {
  delete data.degreeTemp
  delete data.record
}

// Add an event to a record’s timeline
exports.addEvent = (record, content) => {
  record.events.items.push({
    title: content,
    user: 'Provider',
    date: new Date()
  })
}

// Append referrer to string if it exists
exports.getReferrer = referrer => {
  if (referrer && referrer != 'undefined'){
    return `?referrer=${referrer}`
  }
  else return ''
}

// Stolen from manage
exports.getTimeline = (record) => {
  return record.events.items.map(item => {
    return {
      label: {
        text: item.title
      },
      datetime: {
        timestamp: item.date,
        type: 'datetime'
      },
      byline: {
        text: item.user
      }
      // link: getLink(item, record)
    }
  }).reverse()
}

// Check if all sections are complete
exports.recordIsComplete = record => {
  if (!record || !_.get(record, "route")) return false

  let requiredSections = _.get(trainingRoutes, `${record.route}.sections`)
  if (!requiredSections) return false // something went wrong

  let recordIsComplete = true
  requiredSections.forEach(section => {
    if (_.get(record, `${section}.status`) != "Completed"){
      recordIsComplete = false
    }
  })

  return recordIsComplete
}

// Update or create a record
exports.updateRecord = (data, newRecord, timelineMessage) => {

  if (!newRecord) return false

  let records = data.records
  newRecord.updatedDate = new Date()

  if (timelineMessage !== false){
    let message = (timelineMessage) ? timelineMessage : "Record updated"
    exports.addEvent(newRecord, message)
  }
  if (newRecord.addressType == "domestic"){
    delete newRecord.contactDetails.internationalAddress
  }
  if (newRecord.addressType == "international"){
    delete newRecord.contactDetails.address
  }
  data.record = newRecord

  if (newRecord.personalDetails){
    Object.defineProperty(newRecord.personalDetails, 'fullName', {
      get() {
        let names = []
        names.push(this.givenName)
        names.push(this.middleNames)
        names.push(this.familyName)
        return names.filter(Boolean).join(' ')
      },
      enumerable: true
    })
  }
  if (newRecord.personalDetails){
    Object.defineProperty(newRecord.personalDetails, 'shortName', {
      get() {
        let names = []
        names.push(this.givenName)
        names.push(this.familyName)
        return names.filter(Boolean).join(' ')
      },
      enumerable: true
    })
  }

  if (!newRecord.id){
    newRecord.id = faker.random.uuid()
    records.push(newRecord)
  }
  else {
    let recordIndex = records.findIndex(record => record.id == newRecord.id)
    records[recordIndex] = newRecord
  }
  return true
}

// Advance a record to 'QTS recommended' status
exports.registerForTRN = (record) => {

  // We get this if it's a publish route - otherwise hardcode it
  // Todo: in the future we could derive this from the route
  const programmeDetailsDefaults = {
    qualifications: [
      "QTS"
    ],
    summary: "QTS",
    duration: 1
  }

  if (!record) return false

  // Only draft records can be submitted for TRN
  if (record.status != 'Draft'){
    console.log(`Submit a group of records and request TRNs failed: ${record.id} (${record?.personalDetails?.shortName}) has the wrong status (${record.status})`)
    return false
  }

  // Hopefully we won't be supplied any records in the wrong status
  // Just in case though...
  else if (!exports.recordIsComplete(record)){
    console.log(`Submit a group of records and request TRNs failed: ${record.id} (${record?.personalDetails?.shortName}) is not complete`)
    return false
  }
  else {
    record.status = 'Pending TRN'
    record.submittedDate = new Date()
    record.updatedDate = new Date()
    record.programmeDetails = {
      ...programmeDetailsDefaults,
      ...record.programmeDetails
    }
    exports.addEvent(record, "Trainee submitted for TRN")
  }
  return true
}

// Advance a record to 'QTS recommended' status
exports.recommendForQTS = (record, params) => {

  if (!record) return false
  if (record.status == 'QTS recommended'){
    // Nothing to do
  }
  else if (record.status != 'TRN received'){
    console.log(`Recommend a group of trainees for QTS failed: ${record.id} (${record?.personalDetails?.shortName}) has the wrong status (${record.status})`)
    return false
  }
  else {
    record.status = 'QTS recommended'
    _.set(record, 'qtsDetails.standardsAssessedOutcome', "Passed")
    record.qtsRecommendedDate = record?.qtsDetails?.qtsOutcomeRecordedDate || params?.date || new Date()
    record.updatedDate = new Date()
    exports.addEvent(record, "Trainee recommended for QTS")
  }
  return true
}

exports.doBulkAction = (action, record, params) => {
  if (action == 'Submit a group of records and request TRNs'){
    return exports.registerForTRN(record)
  }
  if (action == 'Recommend a group of trainees for QTS'){
    return exports.recommendForQTS(record, params)
  }
}

// Loosely copied from lib/utils
// Needed because some templates live at '/index' and default res.render
// won't look for them in the right folder
exports.render = (path, res, next, ...args) => {

  // Try to render the path
  res.render(path, ...args, function (error, html) {
    if (!error) {
      // Success - send the response
      res.set({ 'Content-type': 'text/html; charset=utf-8' })
      res.end(html)
      return
    }
    if (!error.message.startsWith('template not found')) {
      // We got an error other than template not found - call next with the error
      next(error)
      return
    }
    if (!path.endsWith('/index')) {
      // Maybe it's a folder - try to render [path]/index.html
      exports.render(path + '/index', res, next, ...args)
      return
    }
    // We got template not found both times - call next to trigger the 404 page
    next()
  })
}

// Filter down a set of records for those that match provided filter object
exports.filterRecords = (records, data, filters = {}) => {

  let filteredRecords = records

  // Only show records for training routes that are enabled
  let enabledTrainingRoutes = data.settings.enabledTrainingRoutes

  // Only show records for currently enabled routes or draft records
  filteredRecords = filteredRecords.filter(record => enabledTrainingRoutes.includes(record.route) || (record?.status === 'Draft'))

  // Cycle not implimented yet
  // if (filter.cycle){
  //   filteredRecords = filteredRecords.filter(record => filter.cycle.includes(record.cycle))
  // }

  if (filters.trainingRoutes){
    filteredRecords = filteredRecords.filter(record => filters.trainingRoutes.includes(record.route))
  }

  if (filters.status){
    filteredRecords = filteredRecords.filter(record => filters.status.includes(record.status))
  }

  if (filters.subject && filters.subject != "All subjects"){
    filteredRecords = filteredRecords.filter(record => record?.programmeDetails?.subject == filters.subject)
  }

  return filteredRecords
}
