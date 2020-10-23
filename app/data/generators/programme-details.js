const moment = require('moment')
const weighted = require('weighted')
const trainingRouteData = require('./../training-route-data')
const ittSubjects = require('./../itt-subjects')


module.exports = (faker, route, status) => {

  const level = faker.helpers.randomize(['primary', 'secondary'])
  const ageRange = faker.helpers.randomize(trainingRouteData.levels[level].ageRanges)

  let subject
  if (level == 'primary'){
    subject = faker.helpers.randomize(ittSubjects.primarySubjects)
  }
  else {
      // Bias slightly towards specific subjects but have some random
      // ones too for good measure
      subject = faker.helpers.randomize([
      "English",
      "Maths",
      "Physics",
      "Chemistry",
      "Physical education", // included to test allocations
      faker.helpers.randomize(ittSubjects.secondarySubjects),
      faker.helpers.randomize(ittSubjects.secondarySubjects),
      faker.helpers.randomize(ittSubjects.secondarySubjects),
    ])
  }

  // PE only has allocated places
  let allocatedPlace = (subject == "Physical education") ? "Yes" : undefined

  const statusesWithEndDates = [
    "QTS recommended",
    "QTS awarded"
  ]

  const startDate = faker.date.between('2017-01-01', '2020-08-01')
  const duration = faker.helpers.randomize([1,2,3])
  const endDate = (route != 'Assessment Only' || statusesWithEndDates.includes(status)) ? moment(startDate).add(duration, 'years') : undefined

  return {
    level,
    ageRange,
    subject,
    startDate,
    duration,
    endDate,
    allocatedPlace
  }
}
