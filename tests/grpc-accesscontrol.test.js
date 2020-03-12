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
const readSomething = jest.fn().mockImplementation(
  async call => ({message: 'I did something'})
)
const createSomething = jest.fn().mockImplementation(
  async call => ({message: 'I did something important'})
)
const updateSomething = jest.fn().mockImplementation(
  async call => ({message: 'something has been updated'})
)
const restriction = ({operation, resource}) => promisify((call, cb) => {
  const roles = call.metadata.get('roles')
  const permission = ac.can(roles).execute(operation).sync().on(resource)
  if (permission.granted === true) {
    return cb(null, call)
  }
  const meta = new grpc.Metadata()
  meta.add('custom-authz-message', 'need-admin')
  return cb({
    code: grpc.status.PERMISSION_DENIED,
    details: `Role ${roles} is not authorized to perform ${operation} against ${resource}`,
    metadata: meta,
  })
})
const createSomethingRestriction = restriction({operation: 'create', resource: 'something'})
const mockAuthorization = jest.fn().mockImplementation(createSomethingRestriction)
const applyPolicy = (procedure, operation, resource) => callbackify(composeAsync(restriction({operation: operation, resource: resource}), procedure))
const updateSomethingRpcWithPolicy = applyPolicy(updateSomething, 'update', 'something')

const rpcs = {
  echo: callbackify(echo),
  verifyAdmin: mockAuthorization,
  readSomething: callbackify(composeAsync(readSomething)),
  createSomething: callbackify(composeAsync(mockAuthorization, createSomething)),
  updateSomething: updateSomethingRpcWithPolicy,
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

test('readSomething is ok without any authorization metadata', done => {
  client.readSomething({message: 'hi'}, (err, response) => {
    expect(err).toBe(null)
    expect(response).toEqual({message: 'I did something'})
    expect(readSomething).toHaveBeenCalled()
    done()
  })
})

test('permission denied without proper metadata', done => {
  client.verifyAdmin({message: 'I am Leonhard Euler'}, (err, response) => {
    expect(err).not.toBeNull()
    expect(err.code).toBe(grpc.status.PERMISSION_DENIED)
    expect(err.message).toBe('7 PERMISSION_DENIED: Role  is not authorized to perform create against something')
    expect(response).toBeUndefined()
    done()
  })
})

test('call with no metadata rejected and actual operations not called', done => {
  client.createSomething({message: 'I am Leonhard Euler'}, (err, response) => {
    expect(createSomething).not.toHaveBeenCalled()
    expect(err.code).toBe(grpc.status.PERMISSION_DENIED)
    expect(err.message).toBe('7 PERMISSION_DENIED: Role  is not authorized to perform create against something')
    expect(response).toBeUndefined()
    done()
  })
})

test('not enough privileges to create, bro', done => {
  const meta = new grpc.Metadata()
  meta.add('roles', 'user')
  client.createSomething({message: 'I am Leonhard Euler'}, meta, (err, response) => {
    expect(err.code).toBe(grpc.status.PERMISSION_DENIED)
    expect(err.details).toBe('Role user is not authorized to perform create against something')
    expect(err.message).toBe('7 PERMISSION_DENIED: Role user is not authorized to perform create against something')
    expect(response).toBeUndefined()
    expect(createSomething).not.toHaveBeenCalled()
    done()
  })
})

test('not enough privileges to update, bro', done => {
  const meta = new grpc.Metadata()
  meta.add('roles', 'user')
  client.updateSomething({message: 'I am Leonhard Euler'}, meta, (err, response) => {
    expect(err.code).toBe(grpc.status.PERMISSION_DENIED)
    expect(err.details).toBe('Role user is not authorized to perform update against something')
    expect(response).toBeUndefined()
    expect(updateSomething).not.toHaveBeenCalled()
    done()
  })
})

// TODO: move success test in a separate file
test('valid admin role', done => {
  const meta = new grpc.Metadata()
  meta.add('roles', 'admin')
  client.createSomething({message: 'I am Leonhard Euler'}, meta, (err, response) => {
    expect(err).toBeNull()
    expect(response).toEqual({message: 'I did something important'})
    expect(createSomething).toHaveBeenCalledTimes(1)
    done()
  })
})
