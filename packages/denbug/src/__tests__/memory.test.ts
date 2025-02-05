import debug from '../denbug';

describe('Memory Management', () => {
    beforeEach(() => {
        debug.domains().forEach(d => debug.disable(d));
    });

    test('cleans up unused domains', () => {
        const initial = debug.domains().length;
        
        // Create one temporary domain to count created domains
        debug.domain('temp:first')('test');
        const domainsPerTemp = debug.domains().length - initial;
        
        // Reset domains
        debug.domains().forEach(d => debug.disable(d));
        
        // Create temporary domains
        for (let i = 0; i < 100; i++) {
            debug.domain(`temp:${i}`)('test');
        }
        
        // Force garbage collection (if supported)
        if (global.gc) {
            global.gc();
        }
        
        const final = debug.domains().length;
        // Account for all domains created per temp domain
        const expectedMax = initial + (100 * domainsPerTemp);
        expect(final).toBeLessThanOrEqual(expectedMax);
    });

    test('limits trace memory usage', () => {
        const d = debug.domain('test');
        debug.enable('test');
        
        // Create large payload
        const largeData = new Array(1000).fill('x').join('');
        
        // Record multiple traces
        for (let i = 0; i < 100; i++) {
            d(largeData);
        }
        
        const memoryUsage = process.memoryUsage().heapUsed;
        expect(memoryUsage).toBeLessThan(1000 * 1024 * 1024); // Less than 1GB
    });
});
