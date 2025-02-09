const denbug = require('/c:/tweesic/denbug/packages/denbug/src/denbug');

// Create domains
denbug.domain('widget-a');
denbug.domain('widget-b');
denbug.domain('widget-c');

// Enable all widget components except widget-b
denbug.enable(['widget-*', '-widget-b']);
denbug.enable('-widget-b');

console.log('widget-b state:', denbug.enabled('widget-b'));
console.log('widget-c state:', denbug.enabled('widget-c')); // Output: true
