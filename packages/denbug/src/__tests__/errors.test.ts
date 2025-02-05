import debug from '../denbug';

describe('Error Handling', () => {
    beforeEach(() => {
        debug.domains().forEach(d => debug.disable(d));
    });

    test('handles cyclic objects in traces', () => {
        const d = debug.domain('test');
        debug.enable('test');
        
        const cyclic: any = { prop: 'value' };
        cyclic.self = cyclic;
        
        d('test', cyclic);
        const trace = debug.traces()[0];
        expect(trace.args[1]).toBeDefined();
    });

    test('handles invalid stack traces', () => {
        const d = debug.domain('test');
        debug.enable('test');
        
        const fakeError = { stack: 'Invalid\nStack\nTrace', name: 'Error', message: 'Test' };
        const trace = {
            timestamp: Date.now(),
            domain: 'test',
            args: ['test'],
            error: fakeError
        };
        
        const decoded = debug.decode(trace);
        expect(decoded.stack).toEqual([]);
    });

    test('handles concurrent modifications', async () => {
        const results = await Promise.all([
            debug.domain('concurrent:1'),
            debug.domain('concurrent:2'),
            debug.enable('concurrent:1'),
            debug.disable('concurrent:2')
        ]);
        
        expect(debug.domains()).toContain('concurrent:1');
        expect(debug.domains()).toContain('concurrent:2');
    });
});
