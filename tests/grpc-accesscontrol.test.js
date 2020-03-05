const {callbackify} = require('util')
const grpc = require('grpc')
const simpleGrpcClient = require('./simple-grpc-client')
const simpleGrpcServer = require('./simple-grpc-server')
const echo = async call => {
  // console.log(call.request)
  // console.log(call.metadata)
  console.log(call.metadata.get('role'))
  return {event: 'echo-reply', version: '0.1', message: call.request.message}
}
const doSomething = call => {
  console.log('doing something...', call)
  return {}
}

const rpcs = {
  echo: callbackify(echo),
  doSomething: callbackify(doSomething),
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

test('get UNAUTHENTICATED error without proper metadata', done => {
  client.doSomethingAdmin({message: 'I am Leonhard Euler'}, (err, response) => {
    // console.log(err.message)
    // console.log(grpc.status)
    // expect(err.code).toBe(grpc.status.UNIMPLEMENTED)
    expect(err.code).toBe(grpc.status.UNAUTHENTICATED)
    done()
  })
})
