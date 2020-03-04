const protoLoader = require('@grpc/proto-loader')

const protoOptions = require('./default-proto-options')
const protoPath = `${__dirname}/something.proto`

test('validate proto files', () => {
  const packageDefinition = protoLoader.loadSync(protoPath, protoOptions)
  expect(packageDefinition).toBeDefined()
  expect(Object.keys(packageDefinition)).toEqual([
    'proto.SomethingService', 'proto.SomeRequest', 'proto.SomeResponse', 'proto.EchoRequest', 'proto.EchoResponse'
  ])
})
