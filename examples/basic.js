const denbug = require('/c:/tweesic/denbug/packages/denbug/src/denbug');

// Create a domain
const log = denbug.domain('my-component');

// Check the effective state (initially enabled)
console.log('Initial state:', denbug.enabled('my-component')); // Output: true

// Log a message
log('Hello, world!'); // This will be logged

// Disable the domain
denbug.disable('my-component');

// Check the effective state (now disabled)
console.log('Disabled state:', denbug.enabled('my-component'));  // Output: false

// Log a message (will not be logged)
log('This will not be logged');
