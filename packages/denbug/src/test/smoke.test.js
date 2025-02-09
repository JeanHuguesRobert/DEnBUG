const denbug = require('../denbug');

describe('denbug smoke tests', () => {
    beforeAll(() => {
        // Enable contracts for debugging before tests run.
        denbug.setContractsEnabled(true);
    });

    beforeEach(() => {
        denbug.__reset__();
    });

    afterEach(() => {
        // Reset only existing domains after they've been created
        denbug.domains().forEach(domain => {
            denbug.disable(domain);
        });
    });

    test('hierarchical domains', () => {
        denbug.domain('parent:child:grandchild');
        denbug.enable('parent:child');
        
        expect(denbug.enabled('parent')).toBe(true);
        expect(denbug.enabled('parent:child')).toBe(true);
        expect(denbug.enabled('parent:child:grandchild')).toBe(true);
    });

    test('echo domains', () => {
        const parent = denbug.domain('echo-test');
        const echo = denbug.domain('echo-test:echo');
        
        expect(denbug.enabled('echo-test:echo')).toBe(true);
        denbug.disable('echo-test');
        expect(denbug.enabled('echo-test')).toBe(false);
        expect(denbug.enabled('echo-test:echo')).toBe(false); // Corrected to false
    });

    test('console interception', () => {
        const originalLog = console.log;
        denbug.intercept();
        
        expect(console.log).not.toBe(originalLog);
        expect(denbug.domains()).toContain('log');
        expect(denbug.domains()).toContain('log:echo');
        
        denbug.deintercept();
        expect(console.log).toBe(originalLog);
    });

    test('comprehensive console interception', () => {
        const originalMethods = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
            debug: console.debug
        };
        
        denbug.clear();
        denbug.intercept();
        
        // Enable all console domains
        ['log', 'info', 'warn', 'error', 'debug'].forEach(method => {
            denbug.enable(method);
        });
        
        // Test each console method
        console.log('log message');
        console.info('info message');
        console.warn('warn message');
        console.error('error message');
        console.debug('debug message');
        
        const traces = denbug.traces();
        const messages = traces.filter(t => !t.domain.endsWith(':echo') && t.domain !== 'system');
        
        // Verify traces for each method
        expect(messages.length).toBe(5);
        expect(messages.find(t => t.domain === 'log')?.args[0]).toBe('log message');
        expect(messages.find(t => t.domain === 'info')?.args[0]).toBe('info message');
        expect(messages.find(t => t.domain === 'warn')?.args[0]).toBe('warn message');
        expect(messages.find(t => t.domain === 'error')?.args[0]).toBe('error message');
        expect(messages.find(t => t.domain === 'debug')?.args[0]).toBe('debug message');
        
        denbug.deintercept();
        
        // Verify console methods are restored
        Object.entries(originalMethods).forEach(([method, fn]) => {
            expect(console[method]).toBe(fn);
        });
    });

    test('demand function', () => {
        const demand = denbug.demand('assert-test');
        denbug.enable('assert-test');
        
        expect(() => demand(true, 'ok')).not.toThrow();
        expect(() => demand(false, 'fail')).toThrow('Assertion failed');
    });

    test('trace collection', () => {
        const log = denbug.domain('trace-test');
        
        log('test message');
        const traces = denbug.traces();
        
        expect(traces.length).toBe(3); // One for domain creation, one for echo domain creation, one for the log message
        expect(traces[0].domain).toBe('system');
        expect(traces[0].args[0]).toBe('Domain created: trace-test');
        expect(traces[1].domain).toBe('system');
        expect(traces[1].args[0]).toBe('Echo domain created: trace-test:echo');
        expect(traces[2].domain).toBe('trace-test');
        expect(traces[2].args[0]).toBe('test message');
    });

    test('state management', () => {
        denbug.domain('state-test');
        expect(denbug.state('state-test')).toBe(true); // default state
        
        denbug.state('state-test', false);
        expect(denbug.state('state-test')).toBe(false);
        expect(denbug.enabled('state-test')).toBe(false);
    });

    test('trace filtering', () => {
        denbug.clear();
        
        // Create and enable domains explicitly
        denbug.enable(['app:ui', 'app:api']);  // Enable both domains
        const log1 = denbug.domain('app:ui');
        const log2 = denbug.domain('app:api');
        
        // Call the domain functions directly to generate traces
        log1('UI message');
        log2('API message');
        
        // Get the actual message traces
        const userTraces = denbug.traces().filter(t => 
            !t.domain.startsWith('system') && 
            !t.domain.endsWith(':echo')
        );
        
        // Apply domain pattern filter
        const filteredTraces = denbug.filter(userTraces, { 
            pattern: 'app:ui'
        });
        
        // Debug output - commented but preserved
        // console.log('All traces:', JSON.stringify(denbug.traces(), null, 2));
        // console.log('User traces:', JSON.stringify(userTraces, null, 2));
        // console.log('Filtered traces:', JSON.stringify(filteredTraces, null, 2));
        
        expect(filteredTraces.length).toBe(1);
        expect(filteredTraces[0]?.domain).toBe('app:ui');
        expect(filteredTraces[0]?.args[0]).toBe('UI message');
    });

    test('time-based trace filtering', () => {
        denbug.clear();
        const log = denbug.domain('time-test');
        
        const startTime = 1000;
        const realNow = Date.now;
        
        // Mock Date.now
        Date.now = jest.fn(() => startTime);
        log('first message');
        
        Date.now = jest.fn(() => startTime + 1000);
        log('second message');
        
        Date.now = jest.fn(() => startTime + 2000);
        log('third message');
        
        const allTraces = denbug.traces();
        const filteredTraces = denbug.filter(allTraces, { 
            from: startTime + 500,
            to: startTime + 1500
        });
        
        // Restore original Date.now
        Date.now = realNow;
        
        expect(filteredTraces.length).toBe(1);
        expect(filteredTraces[0].args[0]).toBe('second message');
    });

    test('event subscription', () => {
        const events = [];
        const unsubscribe = denbug.subscribe((event, domain) => {
            events.push({ event, domain });
        });

        const log = denbug.domain('event-test');
        log('test message');
        denbug.disable('event-test');

        expect(events).toContainEqual({ event: 'stateChanged', domain: 'event-test' });
        expect(events).toContainEqual({ event: 'effectiveStateChanged', domain: 'event-test' });
        expect(events.some(e => e.event === 'trace')).toBe(true);

        unsubscribe();
    });

    test('save and load configuration', () => {
        const domainA = denbug.domain('config:a');
        const domainB = denbug.domain('config:b');
        
        denbug.disable('config:a');
        denbug.enable('config:b');
        
        const savedConfig = denbug.save();
        
        // Reset all domains
        denbug.domains().forEach(domain => {
            denbug.disable(domain);
        });
        
        denbug.load(savedConfig);
        
        expect(denbug.enabled('config:a')).toBe(false);
        expect(denbug.enabled('config:b')).toBe(true);
        expect(denbug.enabled('config:a:echo')).toBe(false);
        expect(denbug.enabled('config:b:echo')).toBe(true);
    });

    test('trace decoding', () => {
        const log = denbug.domain('decode-test');
        log('test error message');
        
        const traces = denbug.traces();
        const decoded = denbug.decode(traces[traces.length - 1]);
        
        expect(decoded.domain).toBe('decode-test');
        expect(decoded.args[0]).toBe('test error message');
        expect(decoded.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO date format
        expect(decoded.id).toBeTruthy();
        expect(Array.isArray(decoded.stack)).toBe(true);
        expect(decoded.stack[0]).toHaveProperty('function');
        expect(decoded.stack[0]).toHaveProperty('file');
        expect(decoded.stack[0]).toHaveProperty('line');
        expect(decoded.stack[0]).toHaveProperty('column');
    });

    test('trace decoding with irregular stack format', () => {
        const irregularError = new Error('Test irregular');
        // Set a non-standard stack that doesn't match expected regex.
        irregularError.stack = "Error: Test irregular\nsome random text without proper format";
        const fakeTrace = {
            timestamp: Date.now(),
            domain: 'irregular-test',
            args: ['irregular message'],
            error: irregularError
        };
        const decoded = denbug.decode(fakeTrace);
        expect(decoded.domain).toBe('irregular-test');
        expect(decoded.args[0]).toBe('irregular message');
        expect(Array.isArray(decoded.stack)).toBe(true);
        expect(decoded.stack.length).toBe(0);
    });

    test('configuration management', () => {
        const originalMaxTraces = 10000;
        const newMaxTraces = 5;
        
        denbug.configure({ maxTraces: newMaxTraces });
        
        // Generate more traces than maxTraces
        const log = denbug.domain('config-test');
        for (let i = 0; i < 10; i++) {
            log(`message ${i}`);
        }
        
        const traces = denbug.traces();
        expect(traces.length).toBe(newMaxTraces);
        expect(traces[traces.length - 1].args[0]).toBe('message 9');
        expect(traces[0].args[0]).toBe('message 5');
        
        // Reset to default
        denbug.configure({ maxTraces: originalMaxTraces });
    });

    test('flag behavior', () => {
        let flagValue;
        const log = denbug.domain('flag-test').flag(v => flagValue = v);
        
        // Initial state
        expect(flagValue).toBe(true);
        
        // Disable domain
        denbug.disable('flag-test');
        expect(flagValue).toBe(false);
        
        // Enable domain
        denbug.enable('flag-test');
        expect(flagValue).toBe(true);
        
        // Parent domain affects flag
        const child = denbug.domain('flag-test:child').flag(v => flagValue = v);
        denbug.disable('flag-test');
        expect(flagValue).toBe(false);
        
        // Flag updates when parent is re-enabled
        denbug.enable('flag-test');
        expect(flagValue).toBe(true);
    });

    test('trace serialization and posting', () => {
        denbug.clear();
        const log = denbug.domain('serial-test');
        log('original message');
        
        const originalTraces = denbug.traces();
        const serialized = JSON.stringify(originalTraces);
        denbug.clear();
        
        const restoredTraces = denbug.post(serialized);
        
        expect(restoredTraces.length).toBe(originalTraces.length);
        expect(restoredTraces[restoredTraces.length - 1].domain).toBe('serial-test');
        expect(restoredTraces[restoredTraces.length - 1].args[0]).toBe('original message');
        expect(restoredTraces[restoredTraces.length - 1].timestamp).toBe(originalTraces[originalTraces.length - 1].timestamp);
    });

    test('custom event publishing', () => {
        const received = [];
        const unsubscribe = denbug.subscribe((event, data) => {
            if (event === 'customEvent') {
                received.push(data);
            }
        });
        
        const testData = { key: 'value', timestamp: Date.now() };
        denbug.publish('customEvent', testData);
        
        expect(received).toHaveLength(1);
        expect(received[0]).toEqual(testData);
        
        // Test multiple subscribers
        const received2 = [];
        const unsubscribe2 = denbug.subscribe((event, data) => {
            if (event === 'customEvent') {
                received2.push(data);
            }
        });
        
        denbug.publish('customEvent', testData);
        
        expect(received).toHaveLength(2);
        expect(received2).toHaveLength(1);
        
        unsubscribe();
        unsubscribe2();
    });

    test('parallel domain operations', () => {
        denbug.clear();  // Start with clean state
        const domains = ['parallel:a', 'parallel:b', 'parallel:c'].map(name => {
            const d = denbug.domain(name);
            d.enable();  // Explicitly enable each domain
            return d;
        });
        
        // Test batch disable
        denbug.disable(['parallel:a', 'parallel:b']);
        expect(denbug.enabled('parallel:a')).toBe(false);
        expect(denbug.enabled('parallel:b')).toBe(false);
        expect(denbug.enabled('parallel:c')).toBe(true);
        
        // Test batch enable
        denbug.enable(['parallel:a', 'parallel:b', 'parallel:c']);
        expect(denbug.enabled('parallel:a')).toBe(true);
        expect(denbug.enabled('parallel:b')).toBe(true);
        expect(denbug.enabled('parallel:c')).toBe(true);
        
        // Test mixed operations
        denbug.enable(['parallel:a', '-parallel:b', 'parallel:c']);
        expect(denbug.enabled('parallel:a')).toBe(true);
        expect(denbug.enabled('parallel:b')).toBe(false);
        expect(denbug.enabled('parallel:c')).toBe(true);
    });

    test('error handling and validation', () => {
        // Test invalid domain names
        expect(() => denbug.domain('')).toThrow();
        expect(() => denbug.domain(null)).toThrow();
        expect(() => denbug.domain(undefined)).toThrow();
        
        // Test invalid trace data
        expect(() => denbug.post('invalid json')).toThrow('Invalid trace data format');
        expect(() => denbug.post({})).toThrow('Traces must be an array');
        
        // Test invalid flag setter
        expect(() => denbug.domain('test').flag('not a function')).toThrow('flag() requires a setter function');
        
        // Test invalid configuration
        expect(() => denbug.configure({ maxTraces: 'not a number' })).toThrow();
        
        // Test missing domain state
        expect(denbug.state('nonexistent-domain')).toBeUndefined();
    });

    test('chained method operations', () => {
        let flagValue;
        
        // Create the domain hierarchy
        const root = denbug.domain('chain-test');
        const sub = root.domain('sub');
        const another = sub.domain('another');
        
        // Setup flag and states
        root.flag(v => flagValue = v);
        sub.state(false);  // This should disable sub and its children
        
        // Debug output - commented but preserved
        // console.log('States after setup:', {
        //     root: denbug.enabled('chain-test'),
        //     sub: denbug.enabled('chain-test:sub'),
        //     another: denbug.enabled('chain-test:sub:another')
        // });
        
        expect(denbug.enabled('chain-test')).toBe(true);
        expect(denbug.enabled('chain-test:sub')).toBe(false);
        expect(denbug.enabled('chain-test:sub:another')).toBe(false);
        
        // Enable parent and verify child state
        denbug.enable('chain-test:sub');
        expect(denbug.enabled('chain-test:sub:another')).toBe(true);
    });

    test('disable behavior', () => {
        const log = denbug.domain('test-disable');
        expect(denbug.enabled('test-disable')).toBe(true); // initially enabled

        // Disable the target domain (should only alter its local state)
        denbug.disable('test-disable');
        expect(denbug.enabled('test-disable')).toBe(false);
    });

    test('enable behavior', () => {
        const log = denbug.domain('test-enable');
        // First disable the domain to simulate a disabled local state.
        denbug.disable('test-enable');
        expect(denbug.enabled('test-enable')).toBe(false);

        // Enable should minimally update local state and propagate effective state.
        denbug.enable('test-enable');
        expect(denbug.enabled('test-enable')).toBe(true);
    });

    test('default hierarchical domains are enabled by default', () => {
        // Create domains (including parents)
        denbug.domain('app:feature:subA');
        denbug.domain('app:feature:subB');
        expect(denbug.enabled('app')).toBe(true);
        expect(denbug.enabled('app:feature')).toBe(true);
        expect(denbug.enabled('app:feature:subA')).toBe(true);
        expect(denbug.enabled('app:feature:subB')).toBe(true);
    });

    test('disabling a parent cascades effective state to children', () => {
        // Create domains
        denbug.domain('app:feature:subA');
        denbug.domain('app:feature:subB');
        // Disable the root
        denbug.disable('app');
        expect(denbug.enabled('app')).toBe(false);
        expect(denbug.enabled('app:feature')).toBe(false);
        expect(denbug.enabled('app:feature:subA')).toBe(false);
        expect(denbug.enabled('app:feature:subB')).toBe(false);
    });

    test('child domain created under disabled parent is effective disabled', () => {
        // Disable parent before creating child.
        denbug.disable('parent');
        // Create child under the disabled parent.
        denbug.domain('parent:child');
        expect(denbug.enabled('parent')).toBe(false);
        // Even though child local state is true by default, effective state must be false.
        expect(denbug.enabled('parent:child')).toBe(false);
    });

    test('child domain created under disabled parent is effective disabled', () => {
        // Disable parent first then create child
        denbug.disable('parent');
        const child2 = denbug.domain('parent:child2');
        expect(denbug.enabled('parent')).toBe(false);
        expect(denbug.state('parent:child2')).toBe(true);    // local state remains true
        expect(denbug.enabled('parent:child2')).toBe(false);   // effective state is false
    });

    test('re-enabling a parent updates its children effective states', () => {
        // Create child under disabled parent
        denbug.disable('parent');
        const child = denbug.domain('parent:child');
        expect(denbug.enabled('parent:child')).toBe(false);
        // Re-enable the parent
        denbug.enable('parent');
        expect(denbug.enabled('parent')).toBe(true);
        expect(denbug.enabled('parent:child')).toBe(true);
    });

    test('save configuration reflects local states', () => {
        const domainA = denbug.domain('config:a');
        const domainB = denbug.domain('config:b');
        
        denbug.disable('config:a');
        denbug.enable('config:b');
        
        const saved = denbug.save();
        const aCfg = saved.domains.find(d => d.name === 'config:a');
        const bCfg = saved.domains.find(d => d.name === 'config:b');
        expect(aCfg.localState).toBe(false);
        expect(bCfg.localState).toBe(true);
    });

    test('loading configuration restores domain states', () => {
        // Create domains and set states
        denbug.domain('config:a');
        denbug.domain('config:b');
        denbug.disable('config:a');
        denbug.enable('config:b');
        
        const saved = denbug.save();
        // Reset all domains
        denbug.domains().forEach(domain => {
            denbug.disable(domain);
        });
        
        denbug.load(saved);
        
        expect(denbug.enabled('config:a')).toBe(false);
        expect(denbug.enabled('config:b')).toBe(true);
        expect(denbug.enabled('config:a:echo')).toBe(false);
        expect(denbug.enabled('config:b:echo')).toBe(true);
    });

    test('demand condition type enforcement based on contract toggle', () => {
        // Create a valid demand function for a non-empty domain.
        const d = denbug.demand('demand-test');

        // Disable contracts: non-boolean condition should not throw.
        denbug.setContractsEnabled(false);
        expect(() => d("non-boolean")).not.toThrow();

        // Re-enable contracts: non-boolean condition should throw.
        denbug.setContractsEnabled(true);
        expect(() => d("non-boolean")).toThrow('demand requires a boolean condition');
    });

    test('trace filtering by enabledOnly', () => {
        denbug.clear();
        const logEnabled = denbug.domain('test:enabled');
        const logDisabled = denbug.domain('test:disabled');

        logEnabled('enabled message');
        logDisabled('disabled message');

        // Disable the disabled domain.
        denbug.disable('test:disabled');

        const filteredTraces = denbug.filter(denbug.traces(), { enabledOnly: true });

        expect(filteredTraces.some(t => t.domain === 'test:enabled')).toBe(true);
        expect(filteredTraces.some(t => t.domain === 'test:disabled')).toBe(false);
    });

    test('trace filtering with wildcard pattern', () => {
        denbug.clear();
        const one = denbug.domain('wildcard:one');
        const two = denbug.domain('wildcard:two');
        const other = denbug.domain('other:three');

        one('message one');
        two('message two');
        other('message three');

        const allTraces = denbug.traces();
        const filtered = denbug.filter(allTraces, { pattern: 'wildcard:*' });
        
        expect(filtered.length).toBe(2);
        expect(filtered.every(t => t.domain.startsWith('wildcard'))).toBe(true);
    });

    test('reset functionality', () => {
        // Create a domain and generate a trace
        denbug.domain('reset:test')('test message');
        expect(denbug.traces().length).toBeGreaterThan(0);
        expect(denbug.domains().length).toBeGreaterThan(0);
        
        // Reset the system
        denbug.__reset__();
        
        // Verify that domains and traces are cleared
        expect(denbug.traces().length).toBe(0);
        expect(denbug.domains().length).toBe(0);
    });

    test('event unsubscription', () => {
        let events = [];
        const subscriber = (event, domain) => events.push({ event, domain });
        const unsubscribe = denbug.subscribe(subscriber);
        
        // Trigger an event by changing state for a domain.
        denbug.domain('unsubscribe-test');
        denbug.disable('unsubscribe-test');
        expect(events.some(e => e.domain === 'unsubscribe-test')).toBe(true);
        
        // Clear events, unsubscribe, and trigger another event.
        events = [];
        unsubscribe();
        denbug.enable('unsubscribe-test');
        expect(events.length).toBe(0);
    });

    test('combined trace filtering criteria', () => {
        denbug.clear();
        
        // Create two domains: one enabled and one disabled.
        const includeLog = denbug.domain('combo:filter:include');
        const excludeLog = denbug.domain('combo:filter:exclude');

        denbug.enable('combo:filter:include');
        denbug.disable('combo:filter:exclude');

        // Simulate timestamps.
        const originalNow = Date.now;
        let currentTime = 1000;
        Date.now = jest.fn(() => currentTime);

        includeLog('should include');
        currentTime = 2000;
        excludeLog('should exclude');

        const allTraces = denbug.traces();
        Date.now = originalNow;
        
        // Apply combined filter: matching domain pattern, enabledOnly, and time window.
        const filtered = denbug.filter(allTraces, { 
            pattern: 'combo:filter:*', 
            enabledOnly: true,
            from: 500, 
            to: 1500 
        });
        
        expect(filtered.length).toBe(1);
        expect(filtered[0].domain).toBe('combo:filter:include');
        expect(filtered[0].args[0]).toBe('should include');
    });

    test('post() reconstructs incomplete trace objects with defaults', () => {
        denbug.clear();
        
        // Create traces with missing/incomplete properties:
        const incompleteTraces = [
            { args: 'single argument' },                       // missing timestamp and domain, args not array
            { timestamp: 1234567890, domain: '', args: null },   // empty domain, null args
            { timestamp: undefined, domain: 'incomplete', args: ['ok'] } // undefined timestamp
        ];
        
        const reconstructed = denbug.post(JSON.stringify(incompleteTraces));
        
        // Validate each reconstructed trace
        reconstructed.forEach(trace => {
            expect(trace.timestamp).toBeDefined();
            expect(trace.domain).toBeTruthy();
            expect(Array.isArray(trace.args)).toBe(true);
            expect(trace.error).toBeDefined();
        });
    });

    test('post() preserves extra properties in trace objects', () => {
        denbug.clear();
        
        const rawTraces = [
            {
                timestamp: 1234567890,
                domain: 'extra-test',
                args: ['test message'],
                error: { stack: "Error: test\n    at Object.<anonymous> (/file.js:10:5)" },
                extraInfo: { detail: 'important' }
            }
        ];
        
        const reconstructed = denbug.post(JSON.stringify(rawTraces));
        
        expect(reconstructed[0].extraInfo).toEqual({ detail: 'important' });
    });
});
