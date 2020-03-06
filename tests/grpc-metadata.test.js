const {callbackify} = require('util')
const grpc = require('grpc')
const simpleGrpcClient = require('./simple-grpc-client')
const simpleGrpcServer = require('./simple-grpc-server')

const echo = jest.fn().mockImplementation(async call =>
  // console.log(call.request)
  // console.log(call.metadata)
  // console.log(call.metadata.get('role'))
  ({event: 'echo-reply', version: '0.1', message: call.request.message})
)

const rpcs = {
  echo: callbackify(echo),
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
  // await client.$channel.close()
  testServer.tryShutdown(() => done())
})

test('Server is started', () => {
  expect(testServer.started).toBe(true)
})

test('gRPC basic client-server communication works', done => {
  client.echo({message: 'hi'}, (err, response) => {
    expect(err).toBe(null)
    expect(response.message).toBe('hi')
    done()
  })
})

test('gRPC send metadata', done => {
  const meta = new grpc.Metadata()
  meta.add('role', 'user')
  console.log('meta', meta)
  client.echo({message: 'hi'}, meta, (err, response) => {
    expect(err).toBe(null)
    expect(response.message).toBe('hi')
    expect(echo).toHaveBeenCalled()
    // expect(echo).toHaveBeenCalledWith({}, {})
    // expect(echo.mock.calls).toBe([])
    done()
  })
})

// test.skip('gRPC CallCredentials', done => {
//   const meta = new grpc.Metadata()
//   meta.add('role', 'user')
//   const callCredentials = grpc.credentials.createFromMetadataGenerator(meta)
//   client.echo({message: 'hi, with metadata'}, callCredentials, (err, response) => {
//     done()
//   })
// })
//
