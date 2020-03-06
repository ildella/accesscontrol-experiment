const {callbackify} = require('util')
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
const {compose} = require('ramda')
const __ = require('highland')

const echo = async call => ({event: 'echo-reply', version: '0.1', message: call.request.message})
const doSomething = async call => ({message: 'I did something'})
const doSomethingAdmin = async call => {
  console.log(call.request)
  return {message: 'I did something important'}
}

const protect = (call, cb) => {
  const role = call.metadata.get('role')
  console.log(role[0])
  if (role[0] !== 'admin') {
    console.log('REJECTING, non authenticated')
    return cb({
      code: grpc.status.UNAUTHENTICATED,
      message: 'You have to be an Admin to do this...',
    })
  }
  return cb(null, call)
}

const rpcs = {
  echo: callbackify(echo),
  doSomething: callbackify(doSomething),
  doSomethingAdmin: protect,
  // doSomethingAdmin: compose(doSomethingAdmin, protect),
  // doSomethingAdmin: chained,
}
const grpcServiceConfig = {
  port: 50102,
  protoPath: `${__dirname}/something.proto`,
  service: 'SomethingService',
}
let testServer
let client

beforeAll(async () => {
  const {server, protoDescriptor} = await simpleGrpcServer(grpcServiceConfig, rpcs)
  server.addService(protoDescriptor.proto['SomethingService'].service, rpcs)
  server.start()
  testServer = server
  client = simpleGrpcClient(grpcServiceConfig)
})

afterAll(async done => {
  testServer.tryShutdown(() => done())
})

test('doSomething is ok without any authorization metadata', done => {
  client.doSomething({message: 'hi'}, (err, response) => {
    expect(err).toBe(null)
    expect(response).toEqual({message: 'I did something'})
    done()
  })
})

test('get UNAUTHENTICATED error without proper metadata', done => {
  client.doSomethingAdmin({message: 'I am Leonhard Euler'}, (err, response) => {
    // console.log(err.message)
    expect(err).not.toBeNull()
    expect(err.code).toBe(grpc.status.UNAUTHENTICATED)
    expect(err.message).toBe('16 UNAUTHENTICATED: You have to be an Admin to do this...')
    done()
  })
})

test.skip('valid authorization', done => {
  const meta = new grpc.Metadata()
  meta.add('role', 'admin')
  client.doSomethingAdmin({message: 'I am Leonhard Euler'}, meta, (err, response) => {
    expect(err).toBeNull()
    expect(response).toBe({})
    done()
  })
})
