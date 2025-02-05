import debug from '../denbug';

describe('Advanced Pattern Matching', () => {
    beforeEach(() => {
        debug.domains().forEach(d => debug.disable(d));
    });

    test('handles complex recursive patterns', () => {
        debug.domain('app:ui:button:click');
        debug.domain('app:ui:input:change');
        debug.domain('app:api:user:login');
        
        debug.applyPattern('app:**');
        expect(debug.state('app:ui:button:click')).toBe(true);
        expect(debug.state('app:ui:input:change')).toBe(true);
        expect(debug.state('app:api:user:login')).toBe(true);
    });

    test('combines multiple patterns', () => {
        debug.domain('app:ui:button');
        debug.domain('app:ui:input');
        debug.domain('app:api:user');
        
        debug.applyPatterns({
            enabled: ['app:ui:*'],
            disabled: ['app:ui:button']
        });
        
        expect(debug.state('app:ui:input')).toBe(true);
        expect(debug.state('app:ui:button')).toBe(false);
        expect(debug.state('app:api:user')).toBe(false);
    });

    test('handles pattern priority', () => {
        debug.domain('test:a');
        debug.domain('test:b');
        
        debug.applyPattern('test:*'); // enable all
        debug.applyPattern('-test:a'); // disable specific
        
        expect(debug.state('test:a')).toBe(false);
        expect(debug.state('test:b')).toBe(true);
    });

    test('preserves echo domain states across pattern changes', () => {
        debug.domain('feature:a');
        debug.domain('feature:b');
        
        debug.applyPattern('feature:*');
        debug.applyPattern('-feature:*');
        debug.applyPattern('feature:a');
        
        expect(debug.state('feature:a:echo')).toBe(true);
        expect(debug.state('feature:b:echo')).toBe(true);
    });
});
