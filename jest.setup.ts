import '@testing-library/jest-dom';

// Polyfill TextEncoder / TextDecoder for Node test environment if absent
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

if (typeof global.Request === 'undefined' && typeof Request !== 'undefined') {
  // @ts-ignore
  global.Request = Request;
  // @ts-ignore
  global.Response = Response;
  // @ts-ignore
  global.Headers = Headers;
}
