const AccessControl = require('role-acl')

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

test('magic - multiple roles', () => {
  const permission = ac.can(['user', 'admin']).execute('create').sync().on('article')
  expect(permission.granted).toBe(true)
  expect(permission.attributes).toEqual(['*'])
})

test.skip('role not found throws', () => {
  const permission = ac.can('user2').execute('create').sync().on('article')
  // expect(permission.granted).toBe(true)
  // expect(permission.attributes).toEqual(['*'])
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
