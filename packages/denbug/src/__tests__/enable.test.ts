import debug from '../denbug';
import { expect } from 'chai';

describe('Debug Enable/Disable', () => {
    beforeEach(() => {
        debug.domains().forEach(d => debug.disable(d));
        debug.applyPatterns({ enabled: [], disabled: [] });
    });

    it('correctly enables a domain', () => {
        const domain = 'test-enable';
        
        // Create domain first
        debug.domain(domain);
        
        // Verify initial state
        expect(debug.domains()).to.include(domain);
        expect(debug.state(domain)).to.be.false;
        
        // Enable and verify immediately
        debug.enable(domain);
        
        expect(debug.state(domain)).to.be.true;
    });

    it('handles multiple enable/disable cycles', () => {
        const domain = 'test-cycle';
        
        debug.enable(domain);
        expect(debug.state(domain)).to.be.true;
        
        debug.disable(domain);
        expect(debug.state(domain)).to.be.false;
        
        debug.enable(domain);
        expect(debug.state(domain)).to.be.true;
    });
});
