import debug from '../denbug';

describe('Trace Loading', () => {
    beforeEach(() => {
        debug.domains().forEach(d => debug.disable(d));
    });

    test('loads traces from JSON string', () => {
        const timestamp = Date.now();
        const sampleTraces = JSON.stringify([{
            timestamp,
            domain: 'test',
            args: ['sample message']
        }]);

        const loaded = debug.loadTraces(sampleTraces);
        expect(loaded[0]).toMatchObject({
            timestamp,
            domain: 'test',
            args: ['sample message']
        });
        expect(loaded[0].error).toBeInstanceOf(Error);
    });

    test('loads traces from array', () => {
        const timestamp = Date.now();
        const sampleTraces = [{
            timestamp,
            domain: 'test',
            args: ['sample message']
        }];

        const loaded = debug.loadTraces(sampleTraces);
        expect(loaded[0]).toMatchObject({
            timestamp,
            domain: 'test',
            args: ['sample message']
        });
        expect(loaded[0].error).toBeInstanceOf(Error);
    });

    test('handles missing error property', () => {
        const traces = [{
            timestamp: Date.now(),
            domain: 'test',
            args: ['test']
        }];
        
        const loaded = debug.loadTraces(traces);
        expect(loaded[0].error).toBeInstanceOf(Error);
    });

    test('preserves existing error objects', () => {
        const error = new Error('test error');
        const traces = [{
            timestamp: Date.now(),
            domain: 'test',
            args: ['test'],
            error
        }];
        
        const loaded = debug.loadTraces(traces);
        expect(loaded[0].error).toBe(error);
    });

    test('filters traces by enabled domains', () => {
        const traces = [
            { timestamp: Date.now(), domain: 'enabled', args: ['msg1'] },
            { timestamp: Date.now(), domain: 'disabled', args: ['msg2'] }
        ];

        debug.domain('enabled');
        debug.enable('enabled');

        const filtered = debug.filterTraces(traces, { enabledOnly: true });
        expect(filtered).toHaveLength(1);
        expect(filtered[0].domain).toBe('enabled');
    });

    test('filters traces by pattern', () => {
        const traces = [
            { timestamp: Date.now(), domain: 'app:ui', args: ['msg1'] },
            { timestamp: Date.now(), domain: 'app:api', args: ['msg2'] },
            { timestamp: Date.now(), domain: 'sys:log', args: ['msg3'] }
        ];

        const filtered = debug.filterTraces(traces, { pattern: 'app:*' });
        expect(filtered).toHaveLength(2);
        expect(filtered.every(t => t.domain.startsWith('app:'))).toBe(true);
    });

    test('filters traces by time range', () => {
        const now = Date.now();
        const traces = [
            { timestamp: now - 2000, domain: 'test', args: ['old'] },
            { timestamp: now - 1000, domain: 'test', args: ['mid'] },
            { timestamp: now, domain: 'test', args: ['new'] }
        ];

        const filtered = debug.filterTraces(traces, {
            from: now - 1500,
            to: now - 500
        });
        
        expect(filtered).toHaveLength(1);
        expect(filtered[0].args[0]).toBe('mid');
    });

    test('auto-creates domains from loaded traces', () => {
        const traces = [
            { timestamp: Date.now(), domain: 'auto:ui', args: ['msg1'] },
            { timestamp: Date.now(), domain: 'auto:api', args: ['msg2'] },
            { timestamp: Date.now(), domain: 'auto:ui:button', args: ['msg3'] }
        ];

        debug.loadTraces(traces);
        
        // Check all domains were created
        const domains = debug.domains();
        expect(domains).toContain('auto');
        expect(domains).toContain('auto:ui');
        expect(domains).toContain('auto:api');
        expect(domains).toContain('auto:ui:button');
        
        // Check echo domains were created
        expect(domains).toContain('auto:echo');
        expect(domains).toContain('auto:ui:echo');
        expect(domains).toContain('auto:api:echo');
        expect(domains).toContain('auto:ui:button:echo');
    });

    test('handles duplicate domains in traces', () => {
        const traces = [
            { timestamp: Date.now(), domain: 'dup:test', args: ['msg1'] },
            { timestamp: Date.now(), domain: 'dup:test', args: ['msg2'] }
        ];

        const initialDomainCount = debug.domains().length;
        debug.loadTraces(traces);
        
        // Should only create dup, dup:test and their echo domains
        expect(debug.domains().length).toBe(initialDomainCount + 4);
    });
});
