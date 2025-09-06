require('@testing-library/jest-dom');

// Add TextEncoder/TextDecoder polyfills for Node.js environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;