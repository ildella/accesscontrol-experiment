const protoLoader = require('@grpc/proto-loader')

const protoOptions = require('./default-proto-options')

test('validate proto files', () => {
  const packageDefinition = protoLoader.loadSync(`${__dirname}/something.proto`, protoOptions)
  expect(packageDefinition).toBeDefined()
  expect(Object.keys(packageDefinition)).toEqual([
    'proto.SomethingService', 'proto.EchoRequest', 'proto.EchoResponse'
  ])
})
