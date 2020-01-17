const parse = require('csv-parse/lib/sync')
const AccessControl = require('role-acl')

// role,resource,action,attributes,condition
const acls = `
admin,video,create,"*",
admin,video,read,"*,!id",
`

test('parse grants from CSV definition', () => {
  const grants = parse(acls, {
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

test('basic AccessControl example', () => {
  const customAc = new AccessControl()
  customAc.grant('user') // define new or modify existing role. also takes an array.
    .execute('create').on('video') // equivalent to .execute('create').on('video', ['*'])
    .execute('delete').on('video')
    .execute('read').on('video')
  const permission = customAc.can('user').execute('create').sync().on('video') // <-- Sync Example
  // const permission = await ac.can('user').execute('create').on('video'); // <-- Async Example
  expect(permission.granted).toBe(true)
  expect(permission.attributes).toEqual(['*'])
})

let ac
beforeAll(() => {
  const grantList = [
    {role: 'admin', resource: 'video', action: 'create', attributes: ['*'], condition: ''},
    {role: 'admin', resource: 'video', action: 'read', attributes: ['*']},
    {role: 'admin', resource: 'video', action: 'update', attributes: ['*']},
    {role: 'admin', resource: 'video', action: 'delete', attributes: ['*']},

    {role: 'user', resource: 'video', action: 'create', attributes: ['*']},
    {role: 'user', resource: 'video', action: 'read', attributes: ['*']},
    {role: 'user', resource: 'video', action: 'update', attributes: ['*']},
    {role: 'user', resource: 'video', action: 'delete', attributes: ['*']},
    {role: 'user', resource: 'photo', action: '*', attributes: ['*']},
    {role: 'user', resource: 'account', action: 'read', attributes: ['*', '!id']},
    {role: 'user', resource: 'article', action: ['*', '!delete'], attributes: ['*'], condition: ''},

    {
      role: 'sports/editor', resource: 'article', action: 'create', attributes: ['*'],
      condition: {'Fn': 'EQUALS', 'args': {'category': 'sports'}}
    },
    {
      role: 'sports/editor', resource: 'article', action: 'update', attributes: ['*'],
      condition: {'Fn': 'EQUALS', 'args': {'category': 'sports'}}
    },
  ]
  ac = new AccessControl(grantList)
  // ac.grant(['superadmin']).extend('admin')
})

test('action', () => {
  const permission = ac.can('user').execute('create').sync().on('article')
  expect(permission.granted).toBe(true)
  expect(permission.attributes).toEqual(['*'])
})

test('action - wildcard', () => {
  const permission = ac.can('user').execute('birubiru').sync().on('photo')
  expect(permission.granted).toBe(true)
  expect(permission.attributes).toEqual(['*'])
})

test('action - negative', () => {
  const permission = ac.can('user').execute('delete').sync().on('article')
  expect(permission.granted).toBe(false)
  expect(permission.attributes).toEqual([])
})

test('filter attributes', () => {
  const account = {id: 'some-id', name: 'aName'}
  const permission = ac.can('user').execute('read').sync().on('account')
  expect(permission.granted).toBe(true)
  expect(permission.filter(account)).toEqual({name: 'aName'})
})

test('condition', () => {
  const permission = ac.can('sports/editor').context({category: 'sports'}).execute('update').sync().on('article')
  expect(permission.granted).toBe(true)
  expect(permission.attributes).toEqual(['*'])
})
