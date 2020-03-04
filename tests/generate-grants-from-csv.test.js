const parse = require('csv-parse/lib/sync')

// role,resource,action,attributes,condition
const specification = `
admin,video,create,"*",
admin,video,read,"*,!id",
`

test('parse grants from CSV definition', () => {
  const grants = parse(specification, {
    // columns: true,
    skip_empty_lines: true,
    columns: ['role', 'resource','action','attributes','condition'],
    cast: (value, context) => {
      // if (context.column === 3) {
      if (context.column === 'attributes') {
        console.log(context.header)
        console.log(value)
        return value.split(',')
      } else {
        return value
      }
    }
  })
  // expect(parse.info).toBe({})
  expect(grants).toEqual([
    {role: 'admin', resource: 'video', action: 'create', attributes: ['*'], condition: ''},
    {role: 'admin', resource: 'video', action: 'read', attributes: ['*', '!id'], condition: ''},
  ])
})
