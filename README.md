# denbug

A hierarchical debugging and tracing library with advanced pattern matching and post-mortem analysis.

## Features

- 🌳 Hierarchical debug domains (`app:ui:button`, `app:api:auth`)
- 🔍 Pattern matching with glob and recursive patterns (`app:**`, `ui:*:click`)
- 📝 Automatic trace collection with stack traces
- 🔄 Console method interception
- 💾 Configuration persistence
- 📊 Post-mortem analysis
- 🔬 Trace filtering and search
- 🎯 Echo domains for automatic logging
- ⚡ High performance with large trace sets

## Installation

```bash
npm install denbug
```

## Quick Start

```javascript
import debug from 'denbug';

// Create debug domains
const ui = debug.domain('app:ui');
const api = debug.domain('app:api');

// Enable specific domains
debug.enable('app:ui');

// Log messages
ui('button clicked', { id: 'save-btn' }); // logged
api('request failed', err);               // not logged

// Enable all app domains
debug.applyPattern('app:**');

// Now both will log
ui('form submitted');
api('request success');
```

## Advanced Usage

### Pattern Matching

```javascript
// Enable multiple patterns
debug.applyPatterns({
    enabled: ['app:ui:**', 'app:api:auth:*'],
    disabled: ['app:ui:debug']
});

// Use glob patterns
debug.applyPattern('*.error');    // enable all error domains
debug.applyPattern('-test:*');    // disable all test domains
```

### Post-mortem Analysis

```javascript
// Load traces from storage/network
const savedTraces = await fetchTraces();
const traces = debug.loadTraces(savedTraces);

// Filter traces
const filtered = debug.filterTraces(traces, {
    pattern: 'app:ui:**',        // only UI traces
    enabledOnly: true,           // only from enabled domains
    from: startTime,             // time range
    to: endTime
});

// Analyze traces
filtered.forEach(trace => {
    const decoded = debug.decode(trace);
    console.log(`${decoded.timestamp} [${decoded.domain}]`, ...decoded.args);
    
    // Stack trace analysis
    decoded.stack.forEach(frame => {
        console.log(`  at ${frame.function} (${frame.file}:${frame.line})`);
    });
});
```

### Console Integration

```javascript
// Intercept console methods
debug.installConsoleInterceptors();

// Regular console calls are now traced
console.log('test');  // creates trace in 'log' domain
console.error('oops'); // creates trace in 'error' domain

// Restore original console
debug.restoreConsole();
```

### Configuration Management

```javascript
// Save current configuration
const config = debug.saveConfig();
localStorage.setItem('debug-config', JSON.stringify(config));

// Load configuration
const saved = JSON.parse(localStorage.getItem('debug-config'));
debug.loadConfig(saved);
```

### Echo Domains

Every domain automatically creates an echo domain that's always enabled:

```javascript
const auth = debug.domain('app:auth');

// app:auth:echo is automatically created and enabled
// Use it to ensure critical messages are always logged
auth('login failed');  // only logged if app:auth is enabled
debug.domain('app:auth:echo')('security alert');  // always logged
```

### Zero-Cost Debugging

When using denbug in production, you can leverage JavaScript's short-circuit evaluation to achieve zero-cost debugging. Here's how:

```js
const de = require('denbug');
de&&de.domain('app:startup')('Application starting...');
```

When `de` is undefined (for example, when the module is not included in production builds), the expression short-circuits at `de&&` and the debug function is never called or even constructed. This results in:

- Zero runtime cost in production when `de` is undefined
- No string concatenation
- No function calls
- No argument evaluation

The same works with the demand API:

```js
const man = require('denbug').demand;
man&&man('app:perf')('Performance check:', duration);
```

This pattern is particularly useful when you want to strip out all debugging code in production without using complex build tools or preprocessors.

### Performance Comparison

```js
// Regular debug - always evaluates arguments
debug('domain:name')('Some ' + expensive + ' string concatenation');

// Zero-cost debug - nothing runs when de is undefined
de&&de('domain:name')('Some ' + expensive + ' string concatenation');
```

> **Note**: The `&&` operator short-circuits evaluation, so if `de` is undefined (or falsy), nothing after the `&&` is executed, including string concatenations and function calls.

### Zero-Cost Debugging

Use the JavaScript && operator for zero-cost debugging in production:

```javascript
// Zero-cost trace - completely removed in production when domain is disabled
domain('app:perf') && trace('expensive calculation', result);

// Zero-cost assertion - no overhead when disabled
domain('app:assert') && result === expected || throw new Error('mismatch');

// Combine with logical OR for else conditions
domain('app:debug') && validateInput(data) || defaultValue;

// Use with async operations
domain('app:network') && await validateResponse(res);
```

These patterns are completely removed by JavaScript engines and minifiers when the domain is disabled, resulting in zero runtime cost in production.

## API Reference

### Core
- `domain(name: string): (...args: any[]) => void`
- `enable(name: string): void`
- `disable(name: string): void`
- `state(name: string): boolean`

### Pattern Matching
- `applyPattern(pattern: string): void`
- `applyPatterns(patterns: { enabled?: string[], disabled?: string[] }): void`

### Trace Management
- `traces(): RawTrace[]`
- `loadTraces(traces: string | RawTrace[]): RawTrace[]`
- `filterTraces(traces: RawTrace[], options?: TraceFilterOptions): RawTrace[]`
- `decode(trace: RawTrace): DecodedTrace`

### Configuration
- `saveConfig(): Config`
- `loadConfig(config: Config): void`
- `configure(options: { maxTraces?: number }): void`

### Console Integration
- `installConsoleInterceptors(): void`
- `restoreConsole(): void`

## License

MIT