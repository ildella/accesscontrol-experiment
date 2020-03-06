const grpc = require('grpc')
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

// learn from --> https://github.com/echo-health/node-grpc-interceptors

test('intercept call', () => {
  
})