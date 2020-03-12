const parse = require('csv-parse/lib/sync')

const csvToRolcAclJson = specification => parse(specification, {
  skip_empty_lines: true,
  columns: ['role', 'resource','action','attributes','condition'],
  cast: (value, context) => {
    if (context.column === 'attributes') {
      return value.split(',')
    } else {
      return value
    }
  }
})

module.exports = specification => csvToRolcAclJson(specification)
