const csvToRoleAclJsonGrants = require('../src/csv-to-roleacl-json-grants')

// role,resource,action,attributes,condition
const specification = `
admin,video,create,"*",
admin,video,read,"*,!id",
`

test('parse grants from CSV definition', () => {
  expect(csvToRoleAclJsonGrants(specification)).toEqual([
    {role: 'admin', resource: 'video', action: 'create', attributes: ['*'], condition: ''},
    {role: 'admin', resource: 'video', action: 'read', attributes: ['*', '!id'], condition: ''},
  ])
})
