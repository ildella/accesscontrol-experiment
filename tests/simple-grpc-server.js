const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader')

const defaultProtoOptions = require('./default-proto-options')

module.exports = ({port, host = '0.0.0.0', protoPath, protoOptions = defaultProtoOptions, serverCredentials}) => {
  const packageDefinition = protoLoader.loadSync(protoPath, protoOptions)
  const packageObject = grpc.loadPackageDefinition(packageDefinition)
  const server = new grpc.Server()
  const address = `${host}:${port}`
  const credentials = serverCredentials || grpc.ServerCredentials.createInsecure()
  server.bind(address, credentials)
  return {server, packageObject}
}
