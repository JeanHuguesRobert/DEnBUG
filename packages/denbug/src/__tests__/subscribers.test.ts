import debug from '../denbug';

describe('Subscriber Management', () => {
    beforeEach(() => {
        debug.domains().forEach(d => debug.disable(d));
    });

    test('notifies on state changes', () => {
        const events: any[] = [];
        const unsubscribe = debug.subscribe((event, ...args) => {
            events.push({ event, args });
        });

        debug.domain('test');
        debug.enable('test');
        debug.disable('test');

        expect(events).toContainEqual({
            event: 'stateChanged',
            args: ['test', true]
        });
        expect(events).toContainEqual({
            event: 'stateChanged',
            args: ['test', false]
        });

        unsubscribe();
    });

    test('notifies on traces', () => {
        const events: any[] = [];
        const unsubscribe = debug.subscribe((event, ...args) => {
            events.push({ event, args });
        });

        const d = debug.domain('test');
        debug.enable('test');
        d('test message');

        expect(events.some(e => 
            e.event === 'trace' && 
            e.args[0].domain === 'test' && 
            e.args[0].args[0] === 'test message'
        )).toBe(true);

        unsubscribe();
    });

    test('unsubscribe stops notifications', () => {
        const events: any[] = [];
        const unsubscribe = debug.subscribe((event, ...args) => {
            events.push({ event, args });
        });

        unsubscribe();
        debug.domain('test');
        debug.enable('test');

        expect(events).toHaveLength(0);
    });
});
