const {callbackify} = require('util')
const simpleGrpcJsClient = require('./simple-grpc-js-client')
const simpleGrpcServer = require('./simple-grpc-server')

const echo = async call => {
  console.log(call.request)
  console.log(call.metadata)
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
  port: 50101,
  protoPath: `${__dirname}/something.proto`,
  service: 'SomethingService',
}
let testServer
let client

beforeAll(async () => {
  const {server, packageObject} = await simpleGrpcServer(grpcServiceConfig, rpcs)
  server.addService(packageObject.proto['SomethingService'].service, rpcs)
  server.start()
  testServer = server
  client = simpleGrpcJsClient(grpcServiceConfig)
})

afterAll(async done => {
  // await client.$channel.close()
  testServer.tryShutdown(() => done())
})

test('Server is started', () => {
  expect(testServer.started).toBe(true)
})

test('gRPC client-server communication', done => {
  client.echo({message: 'hi'}, (err, response) => {
    expect(err).toBe(null)
    expect(response.message).toBe('hi')
    done()
  })
})

// test('gRPC CallCredentials', done => {
//   client.doSomething({}, (err, response) => {
//     // expect(err).toBe(null)
//     // expect(response.message).toBe('hi')
//     done()
//   })
// })
