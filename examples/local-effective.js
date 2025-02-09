const denbug = require('/c:/tweesic/denbug/packages/denbug/src/denbug');

// Create hierarchical domains
const logA = denbug.domain('a');
const logAB = denbug.domain('a:b');
const logABC = denbug.domain('a:b:c');

// Enable 'a' and 'a:b'
denbug.enable('a');
denbug.enable('a:b');

// Disable 'a:b'
denbug.disable('a:b');

// Check local and effective states
console.log('a:b local state:', denbug.state('a:b'));         // Output: false
console.log('a:b effective state:', denbug.enabled('a:b'));     // Output: false
console.log('a:b:c effective state:', denbug.enabled('a:b:c')); // Output: false

// Set local state of 'a:b:c' to true
denbug.state('a:b:c', true);

// Check local and effective states
console.log('a:b:c local state:', denbug.state('a:b:c'));       // Output: true
console.log('a:b:c effective state:', denbug.enabled('a:b:c'));   // Output: false
