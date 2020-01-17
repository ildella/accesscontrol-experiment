const AccessControl = require('role-acl')

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
