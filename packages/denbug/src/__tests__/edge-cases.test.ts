import debug from '../denbug';

describe('Edge Cases', () => {
    beforeEach(() => {
        debug.domains().forEach(d => debug.disable(d));
    });

    test('handles circular domain references', () => {
        const a = debug.domain('a:b');
        const b = debug.domain('b:a');
        
        debug.enable('a:b');
        expect(debug.domains()).toContain('a');
        expect(debug.domains()).toContain('b');
    });

    test('handles invalid patterns', () => {
        // Apply invalid patterns
        debug.applyPattern('');
        debug.applyPattern(undefined as any);
        debug.applyPattern('***:invalid');
        debug.applyPattern('::::');
        debug.applyPattern('**:**');
        
        // Get list of domains before adding test domain
        const beforeDomains = new Set(debug.domains());
        
        // Create a test domain and enable it
        const d = debug.domain('test');
        debug.enable('test');
        
        // Get new domains after test domain creation
        const afterDomains = new Set(debug.domains());
        const newDomains = [...afterDomains].filter(d => !beforeDomains.has(d));
        
        // Verify
        expect(debug.state('test')).toBe(true);
        expect(newDomains).toEqual(['test', 'test:echo']); // Only test and its echo domain should be added
        expect(newDomains.every(d => 
            d === 'test' || d === 'test:echo'
        )).toBe(true);
    });

    test('respects max traces limit strictly', () => {
        debug.configure({ maxTraces: 2 });
        const d = debug.domain('test');
        debug.enable('test');
        
        d('one');
        d('two');
        d('three');
        d('four');
        
        const traces = debug.traces();
        expect(traces).toHaveLength(2);
        expect(traces[0].args[0]).toBe('three');
        expect(traces[1].args[0]).toBe('four');
    });

    test('handles stack trace without line info', () => {
        const d = debug.domain('test');
        debug.enable('test');
        
        Error.stackTraceLimit = 1;
        d('test');
        Error.stackTraceLimit = 10;
        
        const decoded = debug.decode(debug.traces()[0]);
        expect(decoded.stack).toBeDefined();
    });
});
