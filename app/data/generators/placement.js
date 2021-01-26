const weighted = require('weighted')
const faker   = require('faker')
const placementSchools = require('../providers.js')
module.exports = (params) => {

  const item = () => {
    const location = faker.helpers.randomize(placementSchools)
    const startMonth = faker.helpers.randomize(['1','2','3','4','5','6','7','8','9','10','11','12'])
    const duration = faker.helpers.randomize(['1','2','4','8','10','12'])

    return {
      location,
      startMonth,
      duration,
      id: faker.random.uuid()
    }
  }

  const count = weighted.select({
    0: 0.3,
    1: 0.5,
    2: 0.2
  })

  const items = []
  for (var i = 0; i < count; i++) {
    items.push(item(faker))
  }

  if (params?.hasPlacements == 'Not yet' || params?.hasPlacements == 'Not required') {
    return {}
  } else {
    return {items: items}
  }

}
