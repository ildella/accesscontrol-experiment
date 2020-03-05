const {GoogleAuth} = require('google-auth-library')
const grpc = require('grpc')
const {credentials} = grpc

test.skip('grpc', () => {
  expect(grpc).toBe({})
})

test.skip('credentials', () => {
  // expect(credentials).toBe({})
  const callCredentials = credentials.createFromMetadataGenerator({role: 'user'})
  expect(callCredentials).toBe({})
})

test.skip('call credentials from Google', done => {
  (new GoogleAuth()).getApplicationDefault((err, auth) => {
    const googleCallCreds = grpc.credentials.createFromGoogleCredential(auth)
    // const combinedCreds = grpc.credentials.combineChannelCredentials(ssl_creds, call_creds)
    expect(googleCallCreds).toBe({})
    done()
  })
})
