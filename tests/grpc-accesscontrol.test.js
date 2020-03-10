const {callbackify, promisify} = require('util')
const grpc = require('grpc')
// console.log(grpc.status)
const AccessControl = require('role-acl')

const simpleGrpcClient = require('./simple-grpc-client')
const simpleGrpcServer = require('./simple-grpc-server')
const grantList = [
  {role: 'user', resource: 'something', action: 'read', attributes: ['*'], condition: ''},
  {role: 'admin', resource: 'something', action: 'read', attributes: ['*'], condition: ''},
  {role: 'admin', resource: 'something', action: 'create', attributes: ['*'], condition: ''},
  {role: 'admin', resource: 'something', action: 'update', attributes: ['*'], condition: ''},
  {role: 'admin', resource: 'something', action: 'delete', attributes: ['*'], condition: ''},
]
const ac = new AccessControl(grantList)
const {composeAsync} = require('../src/promise-composition')

const echo = jest.fn().mockImplementation(
  async call => ({event: 'echo-reply', version: '0.1', message: call.request.message})
)
const doSomething = jest.fn().mockImplementation(
  async call => ({message: 'I did something'})
)
const doSomethingAdmin = jest.fn().mockImplementation(
  async call => ({message: 'I did something important'})
)

const authorizationFilter = jest.fn().mockImplementation(
  (call, cb) => {
    const roles = call.metadata.get('roles')
    const permission = ac.can(roles).execute('create').sync().on('something')
    console.log(`${roles}: granted: ${permission.granted}`)
    if (permission.granted === true) {
      return cb(null, call)
    }
    const meta = new grpc.Metadata()
    meta.add('custom-authz-message', 'need-admin')
    return cb({
      code: grpc.status.UNAUTHENTICATED,
      details: 'You have to be an Admin to do this...',
      metadata: meta,
    })
  }
)

const rpcs = {
  echo: callbackify(echo),
  doSomething: callbackify(composeAsync(doSomething)),
  verifyAdmin: authorizationFilter,
  doSomethingAdmin: callbackify(composeAsync(promisify(authorizationFilter), doSomethingAdmin)),
}
const grpcServiceConfig = {
  port: 50102,
  protoPath: `${__dirname}/something.proto`,
  service: 'SomethingService',
}
const {server, protoDescriptor} = simpleGrpcServer(grpcServiceConfig, rpcs)
server.addService(protoDescriptor.proto['SomethingService'].service, rpcs)
server.start()
const client = simpleGrpcClient(grpcServiceConfig)

afterAll(async done => {
  await grpc.getClientChannel(client).close()
  server.tryShutdown(() => done())
})

test('doSomething is ok without any authorization metadata', done => {
  client.doSomething({message: 'hi'}, (err, response) => {
    expect(err).toBe(null)
    expect(response).toEqual({message: 'I did something'})
    expect(doSomething).toHaveBeenCalled()
    done()
  })
})

test('get UNAUTHENTICATED error without proper metadata', done => {
  client.verifyAdmin({message: 'I am Leonhard Euler'}, (err, response) => {
    expect(err).not.toBeNull()
    expect(authorizationFilter).toHaveBeenCalled()
    expect(err.code).toBe(grpc.status.UNAUTHENTICATED)
    expect(err.message).toBe('16 UNAUTHENTICATED: You have to be an Admin to do this...')
    expect(response).toBeUndefined()
    done()
  })
})

test('call with no metadata fails', done => {
  client.doSomethingAdmin({message: 'I am Leonhard Euler'}, (err, response) => {
    expect(authorizationFilter).toHaveBeenCalled()
    expect(doSomethingAdmin).not.toHaveBeenCalled()
    expect(err.code).toBe(grpc.status.UNAUTHENTICATED)
    expect(err.message).toBe('16 UNAUTHENTICATED: You have to be an Admin to do this...')
    expect(response).toBeUndefined()
    done()
  })
})

test('valid admin role', done => {
  const meta = new grpc.Metadata()
  meta.add('roles', 'admin')
  client.doSomethingAdmin({message: 'I am Leonhard Euler'}, meta, (err, response) => {
    expect(err).toBeNull()
    expect(response).toEqual({message: 'I did something important'})
    done()
  })
})

test('not enough privileges, bro', done => {
  const meta = new grpc.Metadata()
  meta.add('roles', 'user')
  client.doSomethingAdmin({message: 'I am Leonhard Euler'}, meta, (err, response) => {
    expect(err.code).toBe(grpc.status.UNAUTHENTICATED)
    expect(err.details).toBe('You have to be an Admin to do this...')
    expect(err.message).toBe('16 UNAUTHENTICATED: You have to be an Admin to do this...')
    // expect(err.metadata).toBe('')
    // expect(Object.keys(err)).toBe([])
    expect(response).toBeUndefined()
    done()
  })
})
