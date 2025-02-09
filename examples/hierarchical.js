const denbug = require('/c:/tweesic/denbug/packages/denbug/src/denbug');

// Create hierarchical domains
const logA = denbug.domain('a');
const logAB = denbug.domain('a:b');
const logABC = denbug.domain('a:b:c');

// Enable 'a:b'
denbug.enable('a:b');

// Check the effective state
console.log('a state:', denbug.enabled('a'));       // Output: true
console.log('a:b state:', denbug.enabled('a:b'));     // Output: true
console.log('a:b:c state:', denbug.enabled('a:b:c'));   // Output: true

// Disable 'a'
denbug.disable('a');

// Check the effective state
console.log('a state:', denbug.enabled('a'));       // Output: false
console.log('a:b state:', denbug.enabled('a:b'));     // Output: false
console.log('a:b:c state:', denbug.enabled('a:b:c'));   // Output: false

// Enable 'a' again
denbug.enable('a');

// Check the effective state
console.log('a state:', denbug.enabled('a'));       // Output: true
console.log('a:b state:', denbug.enabled('a:b'));     // Output: true
console.log('a:b:c state:', denbug.enabled('a:b:c'));   // Output: true
