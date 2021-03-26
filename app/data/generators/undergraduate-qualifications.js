const faker   = require('faker')
const ugEntryQualifications = require('../undergraduate-qualifications.js')

module.exports = () => {

  const type = faker.helpers.randomize(ugEntryQualifications)
  const tarrifPoints = faker.helpers.randomize(['16','24','32','72','112','136','136','152','160','170','200','320','400'])

  return {
    type,
    tarrifPoints
  }

  // TODO: be smarter about the a tarrif points. Move it to a dev task ! 

}
