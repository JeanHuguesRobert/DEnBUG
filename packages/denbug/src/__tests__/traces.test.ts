import debug from '../denbug';

describe('Trace Management', () => {
    beforeEach(() => {
        // Clear existing traces
        debug.traces().length = 0;
        // Reset configuration
        debug.configure({ maxTraces: 2 });
        // Clear existing domains
        debug.domains().forEach(d => debug.disable(d));
    });

    test('captures traces', () => {
        const d = debug.domain('test');
        debug.enable('test');
        d('hello');
        const traces = debug.traces();
        expect(traces).toHaveLength(1);
        expect(traces[0]).toMatchObject({
            domain: 'test',
            args: ['hello']
        });
    });

    test('decodes traces', () => {
        const d = debug.domain('test');
        debug.enable('test');
        d('hello');
        const decoded = debug.decode(debug.traces()[0]);
        expect(decoded).toMatchObject({
            domain: 'test',
            args: ['hello'],
            stack: expect.any(Array)
        });
        expect(decoded.stack[0]).toMatchObject({
            function: expect.any(String),
            file: expect.any(String),
            line: expect.any(Number),
            column: expect.any(Number)
        });
    });

    test('respects trace limit', () => {
        const domain = 'test:traces';
        debug.enable(domain);
        const d = debug.domain(domain);

        d('one');   // This should be pushed out
        d('two');   // This should stay
        d('three'); // This should stay
        
        const traces = debug.traces();
        expect(traces).toHaveLength(2);
        expect(traces[0].args[0]).toBe('two');
        expect(traces[1].args[0]).toBe('three');
    });

    afterEach(() => {
        // Reset configuration
        debug.configure({ maxTraces: undefined });
    });
});
