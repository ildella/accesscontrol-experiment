const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader')

const defaultProtoOptions = require('./default-proto-options')

module.exports = ({service, protoPath, port, host = 'localhost', protoOptions = defaultProtoOptions}) => {
  const packageDefinition = protoLoader.loadSync(protoPath, protoOptions)
  const packageObject = grpc.loadPackageDefinition(packageDefinition)
  const address = `${host}:${port}`
  return new packageObject.proto[service](address, grpc.credentials.createInsecure())
}
