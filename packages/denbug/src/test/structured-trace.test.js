const denbug = require('../denbug');
const { parseStructuredTrace, filterStructuredTraces } = denbug;

describe('Structured Trace Filtering', () => {
    beforeEach(() => {
        denbug.clear();
    });

    test('should log trace with structured metadata and parse correctly', () => {
        const log = denbug.domain('structured-test');
        log('trace without structured');
        log('trace with structured', { structured: { severity: 'high', tag: 'critical' } });

        const traces = denbug.traces();
        // Parse all traces to enforce structured property
        const parsedTraces = traces.map(parseStructuredTrace);
        expect(parsedTraces.length).toBeGreaterThanOrEqual(2);

        // Verify that at least one trace has a high severity
        const highSeverityTraces = filterStructuredTraces(parsedTraces, 'severity', 'high');
        expect(highSeverityTraces.length).toBeGreaterThan(0);
        expect(highSeverityTraces[0].args[0]).toBe('trace with structured');
    });
});
