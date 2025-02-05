import debug from '../denbug';

describe('Console Interceptors', () => {
    const originalConsole = { ...console };
    
    beforeEach(() => {
        // Reset console
        Object.assign(console, originalConsole);
        debug.domains().forEach(d => debug.disable(d));
    });

    afterAll(() => {
        Object.assign(console, originalConsole);
    });

    test('captures console methods', () => {
        debug.installConsoleInterceptors();
        debug.enable('log');
        
        console.log('test message');
        const traces = debug.traces();
        
        expect(traces).toHaveLength(1);
        expect(traces[0].domain).toBe('log');
        expect(traces[0].args).toEqual(['test message']);
    });

    test('restores console methods', () => {
        debug.installConsoleInterceptors();
        debug.restoreConsole();
        
        const currentLog = console.log;
        expect(currentLog).toBe(originalConsole.log);
    });
});
