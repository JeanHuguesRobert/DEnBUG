# denbug/README.md

# Retracer UI

Retracer UI is a user interface designed to navigate the output of a "Retracer" time step-by-step debugger. This application allows users to visualize debug sessions, view logs, and navigate through stack traces effectively.

## Features

- Display debug session details including logs and stack traces.
- Render a list of log entries for easy navigation.
- Visualize stack traces for specific log entries.
- Provide timeline controls for navigating through the debug session.

## Project Structure

```
denbug
├── src
│   ├── components
│   ├── types
│   ├── utils
│   ├── services
│   └── App.tsx
├── tests
│   └── __mocks__
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

To get started with Retracer UI, clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd denbug
npm install
```

## Usage

To run the application, use the following command:

```bash
npm start
```

# denbug

A lightweight JavaScript execution tracer that gets its name from the `de&&bug()` pattern it uses - literally "de-and-bug". This pattern provides near zero runtime cost when tracing is disabled, thanks to JavaScript's short-circuit evaluation.

## Features

- **Near zero-cost tracing**: Uses JavaScript's `&&` operator (`de&&bug()`) for true near zero-cost when disabled
- **Flexible domains**: Hierarchical trace domains with parent/child relationships
- **Efficient storage**: In-memory circular buffer to manage trace history
- **Rich context**: Automatic stack trace and source location capture
- **Complete data**: Timestamp and argument preservation for each trace point

## Why "denbug"?

The name comes from the tracing pattern it uses:
```javascript
de&&bug("something happened")
```

When `de` is `false`, the `&&` operator short-circuits, and `bug()` is never called - making it extremely efficient. When `de` is `true`, `bug()` executes and captures the trace.

This simple pattern:
- Has near zero performance impact when disabled
- Reads naturally in code
- Is easy to enable/disable at runtime
- Keeps your codebase clean
- Zero cost in production when compiled with dead code removal

## Installation

```bash
npm install denbug
```

## Quick Start

### Single Domain Usage

```javascript
const debug = require("denbug");

// Create a domain
let de = false;
const bug = debug.domain(
  "myapp",
  () => de,
  val => de = val
);

// Enable tracing
debug.enable("myapp");

// Use the tracer
de&&bug("event happened", { details: "some data" });
```

### Multiple Domains

```javascript
// Create domains
let ui_de = false, net_de = false;

const bug_ui = debug.domain("ui", 
  () => ui_de, 
  val => ui_de = val
);

const bug_net = debug.domain("network", 
  () => net_de, 
  val => net_de = val
);

// Enable specific domains
debug.enable("ui");
debug.enable("network");

// Use domain-specific tracers
ui_de&&bug_ui("button clicked", { x: 100, y: 200 });
net_de&&bug_net("request sent", { url: "/api" });
```

## API Reference

### Domains

#### `domain(name, getter, setter)`
Creates a new trace domain.

```javascript
const bug = debug.domain(
  "myapp",       // domain name
  () => de,      // state getter
  val => de = val // state setter
);
```

### Control

#### `enable(name)`
Enables a domain and its children.
```javascript
debug.enable("ui");        // Enable UI domain
debug.enable("ui.button"); // Enable UI button subdomain
```

#### `disable(name)`
Disables a domain and its children.
```javascript
debug.disable("ui"); // Disables UI and all subdomains
```

#### `configure(options)`
Configures the tracer.
```javascript
debug.configure({
  max_entries: 1000 // Set trace buffer size
});
```

### Trace Analysis

#### `traces()`
Returns all captured traces.
```javascript
const traces = debug.getTraces();
```

#### `decode(trace)`
Decodes a trace entry with source location.
```javascript
const decoded = debug.decodeTrace(traces[0]);
```

## Source Maps

When using denbug in a browser environment, you'll need to enable source maps to get proper file locations and source code in your traces. Add this to your webpack config:

```javascript
module.exports = {
    devtool: 'source-map',
    // ...rest of config
};
```

The tracer will automatically use source maps when available to show original source locations and code snippets.

> Note: Source maps should be enabled in development but disabled in production for security reasons.

## Production Usage

### Zero-Cost Architecture

The `de&&bug()` pattern is remarkably efficient in production:

```javascript
de&&bug("expensive operation", { data: complexCalculation() });
```

When `de` is `false`:
- No function calls occur
- `complexCalculation()` is never executed
- No objects are created
- No stack traces are captured
- Zero memory allocation
- No performance impact

This means you can:
- Leave traces in production code
- Enable/disable specific domains on demand
- Activate traces for beta users
- Debug production issues safely
- Keep trace points close to critical code

### Selective Activation

Enable tracing for specific users or scenarios:

```javascript
// Enable for beta users
if (user.isBeta) {
    debug.enable("critical-features");
}

// Enable for error investigation
if (user.id === "problematic-user") {
    debug.enable("payment-flow");
}

// Enable for performance monitoring
if (shouldMonitorPerformance) {
    debug.enable("performance");
}
```

### Memory Management

The circular buffer ensures stable memory usage even with extensive tracing:

```javascript
debug.configure({
    max_entries: 10000    // Keep last 10k traces
});
```

### Production Best Practices

1. **Domain Granularity**
```javascript
// Fine-grained domains for selective enabling
const bug_auth = debug.domain("auth.login");
const bug_auth_2fa = debug.domain("auth.2fa");
const bug_payment = debug.domain("payment.checkout");
```

2. **Contextual Information**
```javascript
// Include useful context without overhead
de&&bug("payment failed", {
    get details() {  // Lazy evaluation
        return { 
            amount: payment.amount,
            error: payment.error
        };
    }
});
```

3. **Performance Sensitive Areas**
```javascript
// Even in tight loops, disabled traces have almost no impact
for(let i = 0; i < 1000000; i++) {
    de&&bug("iteration", { i });  // Near zero cost when de is false
    performExpensiveOperation();
}
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
