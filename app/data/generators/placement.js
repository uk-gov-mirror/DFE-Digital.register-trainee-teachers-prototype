const weighted = require('weighted')
const faker   = require('faker')
const placementSchools = require('../providers.js')
module.exports = () => {

  const item = () => {
    const location = faker.helpers.randomize(placementSchools)
    const duration = faker.helpers.randomize(['1','2','4','8','10','12'])

    return {
      location,
      duration,
      id: faker.random.uuid()
    }
  }

  const count = weighted.select({
    0: 0.5,
    2: 0.4,
    4: 0.1
  })
  const items = []
  for (var i = 0; i < count; i++) {
    items.push(item(faker))
  }

  console.log({items})

  return {items: items}
}
