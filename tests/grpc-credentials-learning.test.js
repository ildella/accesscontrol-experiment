const {GoogleAuth} = require('google-auth-library')
const grpc = require('grpc')
const {credentials} = grpc

// test.skip('grpc', () => {
//   expect(grpc).toBe({})
// })

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

const simpleGrpcClient = require('./simple-grpc-client')
const grpcServiceConfig = {
  port: 50102,
  protoPath: `${__dirname}/something.proto`,
  service: 'SomethingService',
}
test('use channel credentials', () => {
  const client = simpleGrpcClient(grpcServiceConfig)
  // const sslCreds = grpc.credentials.createSsl('rootCerts')
})
