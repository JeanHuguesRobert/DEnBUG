import debug from '../denbug';

describe('Performance Characteristics', () => {
    beforeEach(() => {
        debug.domains().forEach(d => debug.disable(d));
    });

    test('handles many domains efficiently', () => {
        const start = Date.now();
        
        // Create 1000 domains
        for (let i = 0; i < 1000; i++) {
            debug.domain(`domain:${i}`);
        }
        
        const createTime = Date.now() - start;
        expect(createTime).toBeLessThan(1000); // Should take less than 1s
        
        // Enable all domains
        const enableStart = Date.now();
        debug.applyPattern('domain:*');
        const enableTime = Date.now() - enableStart;
        
        expect(enableTime).toBeLessThan(100); // Should take less than 100ms
    });

    test('handles many traces efficiently', () => {
        const d = debug.domain('test');
        debug.enable('test');
        debug.configure({ maxTraces: 10000 });
        
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
            d(`message ${i}`);
        }
        const traceTime = Date.now() - start;
        
        expect(traceTime).toBeLessThan(1000); // Should take less than 1s
    });
});
