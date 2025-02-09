# Structured Trace Format

Structured traces extend the standard trace by supporting additional metadata.
Each trace has:
- timestamp, domain, and arguments as usual.
- a "structured" object containing keys such as severity and tag.

Example:
```json
{
  "timestamp": 1633046400000,
  "domain": "structured-test",
  "args": ["error occurred"],
  "error": { "stack": "Error: ..." },
  "structured": { "severity": "high", "tag": "critical" }
}
```

Usage:
- Traces can be filtered by metadata properties.
- Helper functions (in structured-trace.js) aid in parsing and filtering structured traces.

## Usage Example

```javascript
// Create a structured trace with custom metadata:
const log = denbug.domain('app:api');
log('User login', { structured: { severity: 'info', userId: 1234 } });
```

The `structured` field is merged into the trace record. Filter functions can then be extended to filter based on these keys.

## Implementation Overview

- **Trace Creation:** When a trace is added via `addTrace`, include structured data if present.
- **Filtering and Decoding:** Update these functions to read/display structured metadata.
- **Documentation:** This document serves as a guide for users to leverage structured traces.

Enjoy an even more organized tracing experience!
