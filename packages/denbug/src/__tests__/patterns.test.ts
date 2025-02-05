import debug from '../denbug';

describe('Pattern Matching', () => {
    beforeEach(() => {
        debug.domains().forEach(d => debug.disable(d));
        ['app:ui', 'app:api', 'app:ui:button'].forEach(d => debug.domain(d));
    });

    test('matches exact patterns', () => {
        debug.applyPattern('app:ui');
        expect(debug.state('app:ui')).toBe(true);
        expect(debug.state('app:api')).toBe(false);
    });

    test('matches recursive patterns', () => {
        debug.applyPattern('app:**');
        expect(debug.state('app')).toBe(true);
        expect(debug.state('app:ui')).toBe(true);
        expect(debug.state('app:ui:button')).toBe(true);
    });

    test('matches suffix patterns', () => {
        debug.applyPattern('*:echo');
        debug.domains()
            .filter(d => d.endsWith(':echo'))
            .forEach(d => expect(debug.state(d)).toBe(true));
    });

    test('handles negation patterns', () => {
        debug.applyPattern('app:**');
        debug.applyPattern('-app:ui');
        expect(debug.state('app')).toBe(true);
        expect(debug.state('app:ui')).toBe(false);
        expect(debug.state('app:api')).toBe(true);
    });

    test('applies multiple patterns', () => {
        debug.applyPatterns({
            enabled: ['app:**'],
            disabled: ['app:ui:**']
        });
        expect(debug.state('app:api')).toBe(true);
        expect(debug.state('app:ui')).toBe(false);
        expect(debug.state('app:ui:button')).toBe(false);
    });
});
