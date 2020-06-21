const {callbackify} = require('util')
const grpc = require('@grpc/grpc-js')
// const protoLoader = require('@grpc/proto-loader')

const simpleGrpcServer = require('./simple-grpc-server')
const simpleGrpcClient = require('./simple-grpc-client')

const echo = jest.fn().mockImplementation(async call =>
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

// const {host, port, protoPath} = grpcServiceConfig
// const protoOptions = require('./default-proto-options')
const {server, protoDescriptor} = simpleGrpcServer(grpcServiceConfig, rpcs)
// const packageDefinition = protoLoader.loadSync(protoPath, protoOptions)
// const protoDescriptor = grpc.loadPackageDefinition(packageDefinition)
// const server = new grpc.Server()
// const address = `${host}:${port}`
// const credentials = grpc.ServerCredentials.createInsecure()
// server.bind(address, credentials)
server.addService(protoDescriptor.proto['SomethingService'].service, rpcs)
server.start()
const client = simpleGrpcClient(grpcServiceConfig)

const interceptor = new grpc.InterceptingCall({
  next_call: param => {
    console.log(param)
  },
  requester: {
    start: (metadata, listener, next) => console.log('start', metadata),
    sendMessage: (message, next) => {
      console.log('sendMessage', message)
      next()
    },
    halfClose: next => {
      console.log('halfClose')
      next()
    },
  }
})

afterAll(done => {
  server.tryShutdown(() => done())
})

test('Server is started', () => {
  expect(server.started).toBe(true)
})

// Only custom implementaiton like this exists: https://www.npmjs.com/package/@echo-health/grpc-interceptors
// Used for tracing and monitoring...
test('gRPC basic client-server communication works', done => {
  client.echo({message: 'hi'}, (err, response) => {
    expect(err).toBe(null)
    expect(response.message).toBe('hi')
    done()
  })
})
