import debug from '../denbug';

describe('Configuration Management', () => {
    beforeEach(() => {
        debug.domains().forEach(d => debug.disable(d));
    });

    test('saves configuration', () => {
        debug.configure({ maxTraces: 50 });
        debug.domain('test');
        debug.enable('test');
        
        const config = debug.saveConfig();
        expect(config).toMatchObject({
            version: expect.any(String),
            timestamp: expect.any(Number),
            maxTraces: 50,
            domains: ['test', 'test:echo']
        });
    });

    test('loads configuration', () => {
        const config = {
            version: '1.0.0',
            timestamp: Date.now(),
            maxTraces: 25,
            domains: ['app:ui', 'app:api']
        };
        
        debug.loadConfig(config);
        expect(debug.state('app:ui')).toBe(true);
        expect(debug.state('app:api')).toBe(true);
    });
});
