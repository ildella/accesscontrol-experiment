const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader')

const defaultProtoOptions = require('./default-proto-options')

module.exports = ({
  service,
  protoPath,
  port,
  host = 'localhost',
  protoOptions = defaultProtoOptions,
  credentials = grpc.credentials.createInsecure()
}) => {
  const packageDefinition = protoLoader.loadSync(protoPath, protoOptions)
  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition)
  const address = `${host}:${port}`
  return new protoDescriptor.proto[service](address, credentials)
}
