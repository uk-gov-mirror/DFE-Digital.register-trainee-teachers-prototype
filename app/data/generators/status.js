module.exports = (faker) => {
  return faker.helpers.randomize([
    // 'Deferred',
    'Draft',
    'Pending TRN',
    'TRN received',
    'Pending QTS',
    'QTS awarded',
    'Deferred'
  ])
}
