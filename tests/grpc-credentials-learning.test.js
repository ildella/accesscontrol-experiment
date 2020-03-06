// const {GoogleAuth} = require('google-auth-library')
const grpc = require('grpc')

// const {credentials} = grpc

// test('credentials', () => {
//   const callCredentials = credentials.createFromMetadataGenerator({role: 'user'})
//   // expect(callCredentials).toEqual({})
// })

// test('call credentials from Google', done => {
//   (new GoogleAuth()).getApplicationDefault((err, auth) => {
//     const googleCallCreds = grpc.credentials.createFromGoogleCredential(auth)
//     // const combinedCreds = grpc.credentials.combineChannelCredentials(ssl_creds, call_creds)
//     // expect(googleCallCreds).toBe({})
//     done()
//   })
// })

const grpcServiceConfig = {
  port: 50102,
  protoPath: `${__dirname}/something.proto`,
  service: 'SomethingService',
}
const fs = require('fs')
// openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365
const cert = fs.createReadStream('cert.pem')
const key = fs.createReadStream('key.pem')

test('load server with Channel credentials', () => {
  const {host, port} = grpcServiceConfig
  const server = new grpc.Server()
  const address = `${host}:${port}`
  const credentials = grpc.ServerCredentials.createSsl(cert, [key])
  server.bind(address, credentials)
  expect(server).toBeDefined()
})
