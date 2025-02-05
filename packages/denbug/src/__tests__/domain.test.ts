import debug from '../denbug';

describe('Domain Management', () => {
    beforeEach(() => {
        // Reset debug state
        debug.domains().forEach(d => debug.disable(d));
    });

    test('creates simple domain', () => {
        const d = debug.domain('test');
        expect(debug.domains()).toContain('test');
        expect(debug.state('test')).toBe(false);
    });

    test('creates hierarchical domains', () => {
        debug.domain('app:ui:button');
        expect(debug.domains()).toEqual(
            expect.arrayContaining(['app', 'app:ui', 'app:ui:button'])
        );
    });

    test('creates echo domains', () => {
        debug.domain('test');
        expect(debug.domains()).toContain('test:echo');
        expect(debug.state('test:echo')).toBe(true);
    });
});