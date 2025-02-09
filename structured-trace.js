class StructuredTrace {
    constructor({ timestamp = Date.now(), domain, args, error, structured = {} } = {}) {
        this.timestamp = timestamp;
        this.domain = domain;
        this.args = Array.isArray(args) ? args : [args];
        this.error = error || new Error("No error info");
        this.structured = structured;
    }

    // Returns true if the structured metadata matches all filter criteria.
    matchesFilter(filter) {
        if (!filter || typeof filter !== 'object') return true;
        for (const key in filter) {
            if (this.structured[key] !== filter[key]) {
                return false;
            }
        }
        return true;
    }
}

// Helper functions for structured trace processing

// Parses a trace and ensures the structured property is present.
function parseStructuredTrace(trace) {
    trace.structured = (trace.structured && typeof trace.structured === 'object')
        ? trace.structured
        : {};
    return trace;
}

// Filters an array of traces by a specific metadata key and value.
function filterStructuredTraces(traces, key, value) {
    return traces.filter(trace => {
        const st = trace.structured || {};
        return st[key] === value;
    });
}

module.exports = {
    StructuredTrace,
    parseStructuredTrace,
    filterStructuredTraces
};
