const {callbackify, promisify} = require('util')
const AccessControl = require('role-acl')
const grpc = require('grpc')

const {composeAsync} = require('../src/promise-composition')
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
const echo = jest.fn().mockImplementation(
  async call => ({event: 'echo-reply', version: '0.1', message: call.request.message})
)
const doSomething = jest.fn().mockImplementation(
  async call => ({message: 'I did something'})
)
const doSomethingAdmin = jest.fn().mockImplementation(
  async call => ({message: 'I did something important'})
)
const authzFilter = (call, cb) => {
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
const authorizationFilterPromise = promisify(authzFilter)
const authorizationFilterPromiseMock = jest.fn().mockImplementation(authorizationFilterPromise)

const rpcs = {
  echo: callbackify(echo),
  doSomething: callbackify(composeAsync(doSomething)),
  verifyAdmin: authorizationFilterPromiseMock,
  doSomethingAdmin: callbackify(composeAsync(authorizationFilterPromiseMock, doSomethingAdmin)),
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
// console.log(grpc.status)

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
    expect(err.code).toBe(grpc.status.UNAUTHENTICATED)
    expect(err.message).toBe('16 UNAUTHENTICATED: You have to be an Admin to do this...')
    expect(response).toBeUndefined()
    done()
  })
})

test('call with no metadata rejected and actual operations not called', done => {
  client.doSomethingAdmin({message: 'I am Leonhard Euler'}, (err, response) => {
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
    expect(doSomethingAdmin).toHaveBeenCalledTimes(1)
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
    expect(response).toBeUndefined()
    expect(doSomethingAdmin).toHaveBeenCalledTimes(1) // FIX: move the failures test in a separate file
    done()
  })
})
