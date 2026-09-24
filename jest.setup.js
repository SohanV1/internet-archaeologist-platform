require('@testing-library/jest-dom');

// Polyfill TextEncoder / TextDecoder for Node test environment if absent
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
