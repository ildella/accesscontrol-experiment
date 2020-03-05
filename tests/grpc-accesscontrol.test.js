const {callbackify} = require('util')
const grpc = require('grpc')
const simpleGrpcClient = require('./simple-grpc-client')
const simpleGrpcServer = require('./simple-grpc-server')
const echo = async call =>
  // console.log(call.request)
  // console.log(call.metadata)
  // console.log(call.metadata.get('role'))
  ({event: 'echo-reply', version: '0.1', message: call.request.message})

const doSomething = async call => ({message: 'I did something'})
const doSomethingAdmin = async call => ({message: 'I did something important'})

const rpcs = {
  echo: callbackify(echo),
  doSomething: callbackify(doSomething),
  doSomethingAdmin: callbackify(doSomethingAdmin),
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
    // console.log(grpc.status)
    // expect(err.code).toBe(grpc.status.UNIMPLEMENTED)
    expect(err).not.toBeNull()
    expect(err.code).toBe(grpc.status.UNAUTHENTICATED)
    done()
  })
})
