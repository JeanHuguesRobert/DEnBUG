# denbug - de&&bug()

A hierarchical tracing library with advanced filtering and post-mortem analysis.

## Features

- 🌳 Hierarchical trace domains (e.g. `app:ui:button`, `app:api:auth`)
- 🔍 Glob-style matching for trace filtering (e.g. `app:*`, `ui:*:click`)
- 📝 Automatic trace collection with stack traces
- 🔄 Console method interception
- 💾 Configuration persistence
- 📊 Post-mortem analysis
- 🔬 Trace filtering and search
- ⚡ High performance, near zero-cost when trace disabled

## Installation

```bash
npm install denbug
```

## Quick Start

```javascript
import trace from 'denbug';

// Use the de&&bug() idiom for near zero-cost trace calls.
// For a trace domain "ui", the idiom is: ui_de&&bug_ui()
let ui_de;
const bug_ui = trace('app:ui').flag( v => ui_de );
ui_de&&bug_ui( "button clicked")

// Enable specific domain
trace.enable('app:ui');

// Disable a domain, short syntax
bug_ui.disable();
// Note: ui_de flag is now false
```

## Advanced Usage

### Hierarchical Domains & State Methods

You can inspect and modify the local state of a domain with the short syntax via `.state()`. For example:

```javascript
const parent = trace.domain('parent');
const child = trace.domain('parent:child');

console.log(child.state()); // true (initially)
child.state(false);
console.log(child.state()); // false now
```

You can also retrieve the effective state using `.enabled()` as a method:

```javascript
console.log('Child effective state:', child.enabled()); // reflects effective state
```

### Effective vs Local State

Each domain has a local state and an effective state.  
• The local state (set/get via `.state()`) indicates whether the domain itself is enabled or disabled.  
• The effective state (retrieved via `.enabled()`) accounts for the domain’s local state as well as any state inherited from its parent domains. Thus, even if a domain's local state is true, its effective state will be false if one of its parent domains is disabled.

For example:
```javascript
const parent = trace.domain('parent');
const child = trace.domain('parent:child');

// Initially, both local and effective states are true.
console.log(child.state());      // Local state: true
console.log(child.enabled());    // Effective state: true

// Disabling the parent affects the child's effective state.
trace.disable('parent');
console.log(child.state());      // Local state remains true
console.log(child.enabled());    // Effective state becomes false because the parent's state is false
```

### State Change Events

Whenever the state of a domain changes, it impacts the effective state of its subdomains. The effective state of subdomains is updated, and an event is published. Additionally, a distinct state changed event is published when the local state changes.

For example:
```javascript
const parent = trace.domain('parent');
const child = trace.domain('parent:child');

trace.subscribe((event, domain) => {
    if (event === 'stateChanged') {
        console.log(`State changed for domain: ${domain}`);
    } else if (event === 'effectiveStateChanged') {
        console.log(`Effective state changed for domain: ${domain}`);
    }
});

trace.disable('parent'); // This will trigger effectiveStateChanged for 'parent' and 'parent:child'
trace.state('parent:child', false); // This will trigger stateChanged for 'parent:child'
```

### Subdomain Creation

You can create subdomains directly from an existing domain instance. For example:
```javascript
const root = trace.domain('root');
const child = root.domain('child'); // equivalent to trace.domain('root:child')

child('Subdomain trace message');
console.log('Child effective state:', child.enabled());
```

### Trace Filtering

Filter collected traces using glob-style patterns:
```javascript
const allTraces = trace.traces();
const filtered = trace.filter(allTraces, {
    pattern: 'app:ui:*', // filter traces from all subdomains of app:ui
    enabledOnly: true
});
console.log(filtered);
```

### Post-Mortem Analysis

Save and load configuration and inspect trace details:
```javascript
// Save current configuration
const config = trace.save();
console.log(config);

// Later, load configuration
trace.load(config);

// Decode and analyze a trace
const [firstTrace] = trace.traces();
const decoded = trace.decode(firstTrace);
console.log(decoded.timestamp, decoded.domain, decoded.args);
```

### Console Integration

Intercept console methods to capture traces:
```javascript
trace.intercept();

// Regular console calls now generate traces in their respective domains
console.log('This is a test');

// Restore original console functions
trace.deintercept();
```

### Echo Domains

Every domain automatically creates an echo domain that commands a call to console.log.
```javascript
const app_auth_de&&bug_app_auth = trace.domain('app:auth');
// 'app:auth:echo' is automatically created
app_auth_de&&bug_app_auth('login failed');
trace.domain('app:auth:echo')('alert');  // always logged
```

### Zero-Cost Debugging with Flags

For the most concise style, simply use the short-circuit operator with the flag inlined. For example:
```javascript
let f = false;
const bug__app_ui = trace.domain('app:ui').flag(() => f);
f && bug__app_ui('button clicked');
+```
Here, when f is false the trace call is completely skipped.

### Publishing Events

You can broadcast events to all subscribers using the `publish` method:

```javascript
trace.publish('customEvent', { data: 'example' });
```

## License

MIT