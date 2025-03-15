import { colorize } from './color.js';
import crypto from 'crypto';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { trace } from '@opentelemetry/api';

// Define contractsEnabled flag.
let contractsEnabled = process.env.NODE_ENV !== 'production';

const debug = Object.assign(function(name) {
	// Factory that returns a debug function for a given domain.
    // It prints messages via console.log when the domain is enabled.
	return function (...args) {
		if (debug.enabled(name)) {
			console.log(`[${name}]`, ...args);
		}
	};
}, {
	_enabled: {},
	enable(name) {
		this._enabled[name] = true;
	},
	disable(name) {
		this._enabled[name] = false;
	},
	enabled(name) {
		return !!this._enabled[name];
	}
});

// Global state
const allDomains = new Map();
const subscribers = new Set();
const traceLog = [];  // Changed from traces to traceLog
const config = { 
    maxTraces: 10000,
    version: '1.0.0'
};

// Only track setters and debug functions

function createHierarchicalDomains(fullName) {
    const parts = fullName.split(':');
    let current = '';
    
    // Just create the domains, don't force enable
    parts.forEach(part => {
        current = current ? `${current}:${part}` : part;
        if (!allDomains.has(current)) {
            createDomain(current);
        }
    });
}

// In createDomain(), initialize effectiveEnabled based on parent's effective state.
function createDomain(name) {
    if (!allDomains.has(name)) {
        if (name.includes(':')) {
            const parentName = name.split(':').slice(0, -1).join(':');
            createDomain(parentName);
        }
        // Determine parent's effective state (default true)
        let parentEffective = true;
        const parts = name.split(':');
        if (parts.length > 1) {
            const parentName = parts.slice(0, -1).join(':');
            parentEffective = allDomains.has(parentName) ? allDomains.get(parentName).effectiveEnabled : true;
        }

        // Create the domain with localEnabled true and effectiveEnabled computed from parent
        allDomains.set(name, {
            setters: new Set(),
            debugFn: debug(name),
            localEnabled: true,
            effectiveEnabled: parentEffective && true
        });

        const message = name.endsWith(':echo') 
            ? `Echo domain created: ${name}` 
            : `Domain created: ${name}`;
        addTrace('system', [message]);

        if (!name.endsWith(':echo')) {
            createDomain(`${name}:echo`);
        }
    }
    return allDomains.get(name).debugFn;
}

// Helper to extract parent name
function getParentName(name) {
    const parts = name.split(':');
    if (parts.length === 1) return null;
    return parts.slice(0, -1).join(':');
}

// Modified updateEffectiveStateRecursive: always propagate re-computation to children.
function updateEffectiveStateRecursive(name) {
    const domain = allDomains.get(name);
    if (!domain) return;
    const parentName = getParentName(name);
    const parentEffective = parentName && allDomains.has(parentName)
         ? allDomains.get(parentName).effectiveEnabled
         : true;
    const newEffective = domain.localEnabled && parentEffective;
    if (domain.effectiveEnabled !== newEffective) {
        domain.effectiveEnabled = newEffective;
        notifySubscribers('effectiveStateChanged', name);
        domain.setters.forEach(setter => setter(newEffective));
    } else {
        // Force update notification regardless, to ensure children re-evaluate.
        domain.effectiveEnabled = newEffective;
    }
    // Always propagate to children.
    allDomains.forEach((_, childName) => {
        if (childName.startsWith(name + ':')) {
            updateEffectiveStateRecursive(childName);
        }
    });
}

// Modified enabled() to return the domain's effective state.
function enabled(name) {
    const domain = allDomains.get(name);
    if (!domain) return false;
    return domain.effectiveEnabled;
}

function notifySubscribers(event, ...args) {
    subscribers.forEach(s => s(event, ...args));
}

const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
    assert: console.assert
};

function addTrace(domain, args) {
    const possiblyStructured = args.find(arg => arg && arg.structured && typeof arg.structured === 'object');
    const trace = {
        timestamp: Date.now(),
        domain,
        args: Array.isArray(args) ? args : [args],
        error: new Error(),
        structured: possiblyStructured ? possiblyStructured.structured : {}
    };

    traceLog.push(trace);
    while (traceLog.length > config.maxTraces) {
        traceLog.shift();
    }
    
    notifySubscribers('trace', trace);
    return trace;
}

// New helper function to ensure a trace has a structured property.
function parseStructuredTrace(trace) {
    trace.structured = (trace.structured && typeof trace.structured === 'object')
        ? trace.structured
        : {};
    return trace;
}

// New helper function to filter traces by a given key/value in the structured metadata.
function filterStructuredTraces(traces, key, value) {
    return traces.filter(trace => {
        const st = trace.structured || {};
        return st[key] === value;
    });
}

function intercept() {
    const methods = ['log', 'info', 'warn', 'error', 'debug', 'assert'];
    methods.forEach(method => {
        // Create domain for each console method
        createDomain(method);
        
        // Create echo domain for each console method
        const echoDomainName = `${method}:echo`;
        createDomain(echoDomainName);
        
        console[method] = (...args) => {
            if (method === 'assert') {
                const [condition, ...assertArgs] = args;
                if (!condition) {
                    if (enabled(method)) {
                        addTrace(method, assertArgs);
                    }
                    if (enabled(method) || enabled(echoDomainName)) {
                        originalConsole[method](...assertArgs);
                    } else {
                        originalConsole.assert(condition, ...assertArgs); // Ensure the original assert behavior
                    }
                }
            } else {
                if (enabled(method)) {
                    addTrace(method, args);
                }
                
                if (enabled(method) && enabled(echoDomainName)) {
                    originalConsole[method](...args);
                }
            }
        };
    });
}

function deintercept() {
    Object.assign(console, originalConsole);
}

function demand(name) {
    if (contractsEnabled && (!(typeof name === 'string' && name.trim() !== ''))) {
        throw new Error('demand expects a non-empty domain name');
    }
    const domainFn = createDomain(name);
    return (condition, ...args) => {
        if (contractsEnabled && (typeof condition !== 'boolean')) {
            throw new Error('demand requires a boolean condition');
        }
        if (!condition) {
            const error = new Error('Assertion failed');
            if (enabled(name)) {
                addTrace(name, [...args, error]);
                if (contractsEnabled && traceLog[traceLog.length - 1].domain !== name) {
                    throw new Error('Post-condition: Trace domain mismatch');
                }
            }
            if (enabled(name) || enabled(`${name}:echo`)) {
                domainFn(...args, error);
            }
            throw error;
        }
    };
}

function save() {
    return {
        version: '1.0.0',
        timestamp: Date.now(),
        maxTraces: config.maxTraces,
        domains: Array.from(allDomains.entries()).map(([name, domain]) => ({
            name,
            localState: domain.localEnabled
        }))
    };
}

function load(saved) {
    if (contractsEnabled && (!saved || !Array.isArray(saved.domains))) {
        throw new Error('load expects saved configuration with a domains array');
    }
    if (!saved || !Array.isArray(saved.domains)) {
        throw new Error('Invalid configuration format');
    }

    config.maxTraces = saved.maxTraces || config.maxTraces;

    // Create all domains first
    saved.domains.forEach(({ name }) => {
        if (!allDomains.has(name)) {
            createDomain(name);
        }
    });

    // Then set their states and recalculate effective state recursively
    saved.domains.forEach(({ name, localState }) => {
        const domain = allDomains.get(name);
        if (domain) {
            domain.localEnabled = !!localState;
            notifySubscribers('stateChanged', name);
            updateEffectiveStateRecursive(name);  // <-- Changed: forces proper effective state recalculation
        }
        if (contractsEnabled && domain && domain.localEnabled !== !!localState) {
            throw new Error(`Post-condition: Domain ${name} state mismatch after load`);
        }
    });
}

// Updated enable() function: minimally flip local states in the chain from root to target
function enable(input) {
    if (!Array.isArray(input)) {
        if (contractsEnabled && (!(typeof input === 'string' && input.trim() !== ''))) {
            throw new Error('enable expects a non-empty string');
        }
    }
    if (Array.isArray(input)) {
        input.forEach(item => enable(item));
        return;
    }
    const name = input;
    const isNegative = name.startsWith('-');
    const actualName = isNegative ? name.slice(1) : name;
    if (!isNegative) {
        let parentEffective = true; // For root assume parent effective true.
        let chainName = '';
        const parts = actualName.split(':');
        for (const part of parts) {
            chainName = chainName ? `${chainName}:${part}` : part;
            if (!allDomains.has(chainName)) {
                createDomain(chainName);
            }
            const domain = allDomains.get(chainName);
            // If the domain is not locally true while parent is effectively enabled,
            // update its local state minimally.
            if (parentEffective && !domain.localEnabled) {
                domain.localEnabled = true;
                notifySubscribers('stateChanged', chainName);
            }
            // Force recomputation of the effective state for this domain.
            const newEffective = domain.localEnabled && parentEffective;
            if (domain.effectiveEnabled !== newEffective) {
                domain.effectiveEnabled = newEffective;
                notifySubscribers('effectiveStateChanged', chainName);
                domain.setters.forEach(setter => setter(newEffective));
            }
            parentEffective = domain.effectiveEnabled;
        }
        // Propagate effective state changes (without altering local states) from the target down.
        updateEffectiveStateRecursive(actualName);
    } else {
        // For negative input, use disable() logic.
        if (!allDomains.has(actualName)) {
            createDomain(actualName);
        }
        disable(actualName);
    }
    if (typeof input === 'string' && !input.startsWith('-') && contractsEnabled) {
        if (!enabled(input)) {
            throw new Error('Post-condition: Domain should be enabled');
        }
    }
}

// Updated disable() function: only change the target's local state if needed
function disable(input) {
    if (!Array.isArray(input)) {
        if (contractsEnabled && (!(typeof input === 'string' && input.trim() !== ''))) {
            throw new Error('disable expects a non-empty string');
        }
    }
    if (Array.isArray(input)) {
        input.forEach(item => disable(item));
        return;
    }
    if (!allDomains.has(input)) {
        createDomain(input);
    }
    const domain = allDomains.get(input);
    // Compute parent's effective state.
    const parentName = getParentName(input);
    const parentEffective = parentName && allDomains.has(parentName)
         ? allDomains.get(parentName).effectiveEnabled
         : true;
    // If effective state is true (i.e. domain.localEnabled && parentEffective)
    // then flip the target's local state to false.
    if (domain.localEnabled && parentEffective) {
        domain.localEnabled = false;
        notifySubscribers('stateChanged', input);
    }
    // Propagate effective state changes to children (without altering their local states).
    updateEffectiveStateRecursive(input);
    if (typeof input === 'string' && contractsEnabled) {
        if (enabled(input)) {
            throw new Error('Post-condition: Domain should be disabled');
        }
    }
}

function filter(rawTraces, options = {}) {
    const filtered = rawTraces.filter(trace => {
        // Filter by enabled domains
        if (options.enabledOnly && !enabled(trace.domain)) {
            return false;
        }
        // Filter by domain pattern
        if (options.pattern) {
            const regex = new RegExp(options.pattern.replace(/\*/g, '.*'));
            if (!regex.test(trace.domain)) return false;
        }
        // Filter by time range
        if (options.from && trace.timestamp < options.from) {
            return false;
        }
        if (options.to && trace.timestamp > options.to) {
            return false;
        }
        // New filtering on structured metadata
        if (options.structured && typeof options.structured === 'object') {
            for (const key in options.structured) {
                if (trace.structured[key] !== options.structured[key]) {
                    return false;
                }
            }
        }
        return true;
    });
    return filtered;
}

function post(serializedTraces) {
    if (typeof serializedTraces === 'string') {
        try {
            serializedTraces = JSON.parse(serializedTraces);
        } catch (e) {
            throw new Error('Invalid trace data format');
        }
    }

    if (!Array.isArray(serializedTraces)) {
        throw new Error('Traces must be an array');
    }

    // Extract unique domains from traces
    const uniqueDomains = new Set(
        serializedTraces.map(trace => trace.domain).filter(Boolean)
    );

    // Create domains before processing traces
    uniqueDomains.forEach(domain => {
        if (!allDomains.has(domain)) { 
            createDomain(domain);
        }
    });

    // Reconstruct traces while keeping additional properties intact
    return serializedTraces.map(trace => {
        return {
            ...trace,
            timestamp: trace.timestamp || Date.now(),
            domain: trace.domain || 'unknown',
            args: Array.isArray(trace.args) ? trace.args : [trace.args],
            error: trace.error || new Error('No error info')
        };
    });
}

function attachFlag(bug, name, setter) {
    if (contractsEnabled && (typeof setter !== 'function')) {
        throw new Error('attachFlag requires a setter function');
    }
    // Set initial state
    setter(debug.enabled(name));
    // Add setter to domain
    allDomains.get(name).setters.add(setter);
    const domainObj = allDomains.get(name);
    if (contractsEnabled && !domainObj.setters.has(setter)) {
        throw new Error('Post-condition: Flag setter not attached');
    }
    return bug;
}

function domain(name) {
    if (contractsEnabled && (!(typeof name === 'string' && name.trim() !== ''))) {
        throw new Error('Domain name must be a non-empty string');
    }
    createHierarchicalDomains(name);
    
    const debugFn = createDomain(name);
    if (contractsEnabled && !allDomains.has(name)) {
        throw new Error('Post-condition: Domain creation failed');
    }
    const isEchoDomain = name.endsWith(':echo');
    const parentName = isEchoDomain ? name.slice(0, -5) : null;
    
    const enhancedDebugFn = (...args) => {
        if (enabled(name)) {
            addTrace(name, args);
            debugFn(...args); // Always call debugFn when enabled
        }
    };
    
    enhancedDebugFn.enabled = () => enabled(name);
    
    enhancedDebugFn.flag = (setter) => {
        if (contractsEnabled && (typeof setter !== 'function')) {
            throw new Error('flag() requires a setter function');
        }
        setter(enabled(name)); // initial update
        allDomains.get(name).setters.add(setter);
        return enhancedDebugFn;
    };
    
    enhancedDebugFn.enable = () => {
        enable(name);
        return enhancedDebugFn;
    };
    
    enhancedDebugFn.disable = () => {
        disable(name);
        return enhancedDebugFn;
    };

    enhancedDebugFn.state = (newState) => {
        if (newState === undefined) {
            return state(name);
        } else {
            state(name, newState);
            return enhancedDebugFn;
        }
    };

    enhancedDebugFn.domain = (subName) => domain(name + ':' + subName);

    return enhancedDebugFn;
}

function flag(setter) {
    if (contractsEnabled && (typeof setter !== 'function')) {
        throw new Error('flag() requires a setter function');
    }
    return (name) => domain(name).flag(setter);
}

function configure(options) {
    if (options.maxTraces !== undefined) {
        if (typeof options.maxTraces !== 'number' || options.maxTraces < 0) {
            throw new Error('maxTraces must be a non-negative number');
        }
        config.maxTraces = options.maxTraces;
    }
}

function traces(){
    return [...traceLog];  // Changed from traces to traceLog
}

function clear() {
    traceLog.length = 0;
}

function decode( trace ){
    return ({
        id: crypto.randomUUID(),
        timestamp: new Date(trace.timestamp).toISOString(),
        domain: trace.domain,
        args: trace.args,
        stack: trace.error.stack
            .split('\n')
            .slice(1)
            .map(line => {
                const match = line.match(/at (.+?) \((.+?):(\d+):(\d+)\)/);
                if (!match) return null;
                const [_, fnName, filePath, lineNum, colNum] = match;
                return {
                    function: fnName,
                    file: filePath,
                    line: parseInt(lineNum),
                    column: parseInt(colNum)
                };
            })
            .filter(Boolean)
    })
}

function domains() {
    return Array.from(allDomains.keys());
}

function subscribe(subscriber) {
    subscribers.add(subscriber);
    return () => subscribers.delete(subscriber);
}

function publish(event, ...args) {
    notifySubscribers(event, ...args);
}

function updateChildDebugState(parentName) {
    allDomains.forEach((domain, name) => {
        if (name.startsWith(parentName + ':')) {
            // Check if all parents in the chain are enabled
            const parentEnabled = parentDomainsEnabled(name);
            const newState = parentEnabled && domain.localEnabled;

            // Update debug state based on both local and parent states
            if (newState) {
                debug.enable(name);
            } else {
                debug.disable(name);
            }
            
            notifySubscribers('effectiveStateChanged', name);
            domain.setters.forEach(setter => setter(newState));
        }
    });
}

function getEffectiveState(name) {
    return debug.enabled(name);
}

// In state(), after updating localEnabled call updateEffectiveStateRecursive().
function state(name, newState) {
    if (contractsEnabled && (!(typeof name === 'string' && name.trim() !== ''))) {
        throw new Error('state expects a non-empty domain name');
    }
    const domain = allDomains.get(name);
    if (newState === undefined) {
        // Removed the assert-like check to allow returning undefined for non-existing domains.
        return domain ? domain.localEnabled : undefined;
    }
    const previous = domain.localEnabled;
    domain.localEnabled = !!newState;
    if (previous !== domain.localEnabled) {
        notifySubscribers('stateChanged', name);
        updateEffectiveStateRecursive(name);
    }
    const result = domain.debugFn;
    if (contractsEnabled && domain.localEnabled !== !!newState) {
        throw new Error('Post-condition: Local state not updated correctly');
    }
    return result;
}

function notifyEffectiveStateChanges(name) {
    // Notify about this domain's effective state change
    notifySubscribers('effectiveStateChanged', name);
    
    // Notify about children's effective state changes
    allDomains.forEach((_, childName) => {
        if (childName.startsWith(name + ':')) {
            notifySubscribers('effectiveStateChanged', childName);
        }
    });
}

function parentDomainsEnabled(name) {
    const parts = name.split(':');
    let current = '';
    for (let i = 0; i < parts.length - 1; i++) {
        current = current ? `${current}:${parts[i]}` : parts[i];
        const parentDomain = allDomains.get(current);
        if (!parentDomain || !parentDomain.localEnabled) {
            return false;
        }
    }
    return true;
}

function setContractsEnabled(value) {
    contractsEnabled = !!value;
}

if (process.env.ENABLE_TELEMETRY === 'true') {
    const provider = new NodeTracerProvider();
    const exporter = new OTLPTraceExporter({ url: 'http://localhost:4317' });
    provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
    provider.register();
    const tracer = trace.getTracer('example-tracer');
    const span = tracer.startSpan('example-span');
    console.log('Hello, OpenTelemetry!');
    span.end();
}

const denbug = {
    domain,
    flag,
    enable,
    disable,
    configure,
    traces,
    clear,
    decode,
    domains,
    state,
    enabled,
    subscribe,
    publish,
    intercept,
    deintercept,
    demand,
    save,
    load,
    filter,
    post,
    // New reset function for testing purposes
    __reset__: function() {
        allDomains.clear();
        traceLog.length = 0;
        subscribers.clear();
    },
    // New contracts control function.
    setContractsEnabled,
    // Attach helper functions to the denbug object.
    parseStructuredTrace,
    filterStructuredTraces
};

module.exports = denbug;
module.exports.default = denbug;
