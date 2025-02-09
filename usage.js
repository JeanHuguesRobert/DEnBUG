/**
 * usage.js - Initial usage examples for denbug API.
 */

const trace = require('denbug');

// === Basic Usage ===
const basic = trace.domain('basic');
console.log('Basic domain initial state:', trace.enabled('basic'));
basic('This is a basic debug message.');

// Subdomain creation
root = trace( 'root' );
child = root.domain( 'child' );

// === Hierarchical Domains ===
const parent = trace.domain('parent');
const child = trace.domain('parent:child');
// Initially, the parent's state is enabled by default
console.log('Parent state:', trace.enabled('parent'));
console.log('Child state (before enabling):', trace.enabled('parent:child'));

// Enable child domain explicitly
trace.enable('parent:child');
console.log('Child state (after enabling):', trace.enabled('parent:child'));
child('Child debug message');

// Example of child.enabled() as a method
console.log('Child effective state (via method):', child.enabled());

// Shorter syntax for enabling domains
parent.enable();
console.log('Parent state (after enabling):', trace.enabled('parent'));

// Effective state of child domains depends on parent state
parent.disable();
console.log('Parent state (after disabling):', trace.enabled('parent'));

// Child local state is still enabled, .state() != .enabled()
console.log('Child state (after disabling parent):', child.state());


// Disable parent domain and observe child effective state
trace.disable('parent');
console.log('Parent state (after disabling):', trace.enabled('parent'));
console.log('Child state (after disabling parent):', trace.enabled('parent:child'));
child('This message will not be logged');

// === Echo Domains, for console.log() output ===
const auth = trace.domain('auth');
console.log('Auth echo domain always enabled:', trace.enabled('auth:echo'));
auth('Authentication message (logged only if "auth" is enabled)');
trace.domain('auth:echo')('Alert: Always logged via echo domain');

// === Zero-Cost Debugging with Flags ===
// Using short-circuit operator for near zero-cost debugging.
let de = false;
const bug = trace.domain('app').flag(() => de);
de&&bug('This message is skipped because flag de is false');
bug.enable();
de&&bug('Now flag is true: debug message from app');

// === Trace Filtering and Post-Mortem Analysis ===
const tracer = trace.domain('tracer');
tracer.enable();
tracer('Captured trace message');
const allTraces = trace.traces();
console.log('All traces:', allTraces);
const filteredTraces = trace.filter(allTraces, { pattern: 'tracer', enabledOnly: true });
console.log('Filtered traces:', filteredTraces);

// ...additional usage examples as needed...
