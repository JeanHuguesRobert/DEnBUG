import debug from '../denbug';
import { expect } from 'chai';

describe('Zero Cost Debugging', () => {
    beforeEach(() => {
        debug.domains().forEach(d => debug.disable(d));
    });

    describe('API Usage', () => {
        it('supports direct flag creation', () => {
            let de = false;
            const bug = debug.flag(val => de = val)('test');
            expect(de).to.be.false;
            debug.enable('test');
            expect(de).to.be.true;
        });

        it('supports fluent flag attachment', () => {
            let de = false;
            const domain = debug.domain('test');
            const bug = domain.flag ? domain.flag(val => de = val) : () => {};
            expect(de).to.be.false;
            debug.enable('test');
            expect(de).to.be.true;
        });

        it('allows multiple flags on same domain', () => {
            let flag1 = false, flag2 = false;
            const domain = 'shared';
            
            debug.flag(val => flag1 = val)(domain);
            debug.domain(domain).flag(val => flag2 = val);

            expect(flag1).to.be.false;
            expect(flag2).to.be.false;
            
            debug.enable(domain);
            expect(flag1).to.be.true;
            expect(flag2).to.be.true;
        });
    });

    describe('Zero Cost Patterns', () => {
        it('skips expensive operations when disabled', () => {
            let de = false;
            let called = false;
            const bug = debug.domain('test').flag(val => de = val);
            
            de && bug('test', (called = true));
            expect(called).to.be.false;
            
            debug.enable('test');
            de && bug('test', (called = true));
            expect(called).to.be.true;
        });

        it('supports async operations', async () => {
            let de = false;
            let called = false;
            const bug = debug.flag(val => de = val)('async');
            
            await (de && bug('test', await (called = true)));
            expect(called).to.be.false;
            
            debug.enable('async');
            await (de && bug('test', await (called = true)));
            expect(called).to.be.true;
        });

        it('works with fallback pattern', () => {
            let de = false;
            const bug = debug.domain('test').flag(val => de = val);
            
            const result1 = de && bug('value') || 'fallback';
            expect(result1).to.equal('fallback');
            
            debug.enable('test');
            const result2 = de && bug('value') || 'fallback';
            expect(result2).to.not.equal('fallback');
        });
    });

    describe('State Management', () => {
        beforeEach(() => {
            // Clear all state
            debug.domains().forEach(d => debug.disable(d));
            // Reset patterns and ensure clean state
            debug.applyPatterns({ enabled: [], disabled: [] });
        });

        it('correctly reports domain state', () => {
            const domain = 'test-state';
            // First verify initial state
            expect(debug.state(domain)).to.be.false;
            // Then enable and verify
            debug.enable(domain);
            // Check both state methods
            expect(debug.state(domain)).to.be.true;
            expect(debug.effectiveState(domain)).to.be.true;
        });

        it('reports effective state considering patterns', async () => {
            const domain = 'pattern:test';
            // First verify initial state
            expect(debug.state(domain)).to.be.false;
            expect(debug.effectiveState(domain)).to.be.false;
            // Apply pattern and verify
            debug.applyPattern('pattern:*');
            // Pattern should affect effective state but not direct state
            expect(debug.effectiveState(domain)).to.be.true;
            expect(debug.state(domain)).to.be.false;
        });
    });

    describe('Demand API', () => {
        it('supports conditional debugging', () => {
            let called = false;
            const domain = 'test-demand';
            debug.enable(domain);
            const bug = debug.demand(domain);
            
            bug(false, () => { called = true; });
            expect(called).to.be.false;
            
            bug(true, () => { called = true; });
            expect(called).to.be.true;
        });
    });

    describe('Trace Management', () => {
        beforeEach(() => {
            debug.configure({ maxTraces: 1 }); // Limit trace count
        });

        it('captures traces when enabled', () => {
            const domain = 'trace-test';
            const bug = debug.domain(domain);
            
            debug.enable(domain);
            bug('test message');
            
            const traces = debug.traces();
            expect(traces).to.have.length(1);
            
            const decoded = debug.decode(traces[0]);
            expect(decoded.domain).to.equal(domain);
            expect(decoded.args[0]).to.equal('test message');
        });

        afterEach(() => {
            debug.configure({ maxTraces: undefined }); // Reset trace limit
        });
    });
});
