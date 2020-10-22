const moment = require('moment')
const weighted = require('weighted')


module.exports = (faker, status) => {

  // const ageRange = faker.helpers.randomize([
  //   "2 - 4 years",
  //   "5 - 11 years",
  //   "12 - 17 years"
  // ])

  const ageRanges = {
    "one": "5 to 11 programme",
    "two": "11 to 16 programme",
    "three": "11 to 18 programme",
    "four": "3 to 11 programme",
    "five": "3 to 7 programme"
  }

  const selectedAgeRange = weighted.select({
    one: 0.41,
    two: 0.26,
    three: 0.14,
    four: 0.1,
    five: 0.09
  })

  const ageRange = ageRanges[selectedAgeRange]

  const subject = faker.helpers.randomize([
    "English",
    "Maths",
    "Physics",
    "Chemistry"])

  const statusesWithEndDates = [
    "QTS recommended",
    "QTS awarded"
  ]

  const startDate = faker.date.between('2017-01-01', '2020-08-01')
  const duration = faker.helpers.randomize([1,2,3])
  const endDate = (statusesWithEndDates.includes(status)) ? moment(startDate).add(duration, 'years') : undefined

  return {
    ageRange,
    subject,
    startDate,
    duration,
    endDate
  }
}


// Age range options (only top 5 used - which make up majority)
// "0 to 5 programme",
// "3 to 7 programme",
// "3 to 8 programme",
// "3 to 9 programme",
// "3 to 11 programme",
// "5 to 9 programme",
// "5 to 11 programme",
// "5 to 14 programme",
// "7 to 11 programme",
// "7 to 14 programme",
// "7 to 16 programme",
// "9 to 14 programme",
// "9 to 16 programme",
// "11 to 16 programme",
// "11 to 19 programme",
// "14 to 19 programme",
// "14 to 19 Diploma",
