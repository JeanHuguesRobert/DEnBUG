const crypto = require('crypto');
const debug = require('debug');

// Global state
const domains = new Map();
const subscribers = new Set();
const traces = [];
const config = { 
    maxTraces: 1000,
    version: '1.0.0'
};

// Only track setters and debug functions

function createHierarchicalDomains(fullName) {
    const parts = fullName.split(':');
    let current = '';
    parts.forEach(part => {
        current = current ? `${current}:${part}` : part;
        if (!domains.has(current)) {
            createDomain(current);
        }
    });
}

function createDomain(name) {
    if (!domains.has(name)) {
        // Create main domain
        domains.set(name, {
            setters: new Set(),
            debugFn: debug(name)
        });
        
        // Always create and enable echo domain for non-echo domains
        if (!name.endsWith(':echo')) {
            const echoDomain = `${name}:echo`;
            if (!domains.has(echoDomain)) {
                domains.set(echoDomain, {
                    setters: new Set(),
                    debugFn: debug(echoDomain)
                });
                // Enable echo domain immediately and ensure it stays enabled
                debug.enable(echoDomain);
            }
        }
    }
    return domains.get(name).debugFn;
}

function isEnabled(name) {
    return debug.enabled(name);
}

function notifySubscribers(event, ...args) {
    subscribers.forEach(s => s(event, ...args));
}

function applyPattern(pattern) {
    if (!pattern) return;
    
    const shouldDisable = pattern.startsWith('-');
    const actualPattern = shouldDisable ? pattern.slice(1) : pattern;
    
    // Save echo domains for this pattern
    const echoPattern = `${actualPattern}:echo`;
    const matchingDomains = Array.from(domains.keys())
        .filter(name => name.endsWith(':echo') && 
            (name === echoPattern || 
             (actualPattern.includes('*') && name.startsWith(actualPattern.replace(/\*/g, '')))));
    
    // Apply main pattern
    if (shouldDisable) {
        debug.disable(actualPattern);
    } else {
        debug.enable(actualPattern);
    }

    // Re-enable echo domains
    matchingDomains.forEach(name => debug.enable(name));

    // Create domain if needed
    if (!actualPattern.includes('*') && !domains.has(actualPattern)) {
        createDomain(actualPattern);
    }

    // Update setters
    domains.forEach((domain, name) => {
        domain.setters.forEach(setter => setter(debug.enabled(name)));
    });
}

const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
};

function addTrace(domain, args) {
    const trace = {
        timestamp: Date.now(),
        domain,
        args: Array.isArray(args) ? args : [args],
        error: new Error()
    };

    traces.push(trace);
    while (traces.length > config.maxTraces) {
        traces.shift();
    }
    
    notifySubscribers('trace', trace);
    return trace;
}

function installConsoleInterceptors() {
    const methods = ['log', 'info', 'warn', 'error', 'debug'];
    methods.forEach(method => {
        // Create domain for each console method
        createDomain(method);
        console[method] = (...args) => {
            if (isEnabled(method)) {
                addTrace(method, args);
            }
            originalConsole[method](...args);
        };
    });
}

function restoreConsole() {
    Object.assign(console, originalConsole);
}

function demand(name) {
    const domain = createDomain(name);
    return (...args) => {
        if (isEnabled(name)) {
            return addTrace(name, args);
        }
    };
}

function saveConfig() {
    const enabledDomains = Array.from(domains.entries())
        .filter(([name]) => debug.enabled(name))
        .map(([name]) => name);
    const configToSave = {
        version: '1.0.0',
        timestamp: Date.now(),
        maxTraces: config.maxTraces,
        domains: enabledDomains
    };

    return configToSave;
}

function loadConfig(saved) {
    if (saved.maxTraces) config.maxTraces = saved.maxTraces;
    
    // Create all domains first
    if (Array.isArray(saved.domains)) {
        saved.domains.forEach(name => createDomain(name));
    } else if (Array.isArray(saved.enabled)) {
        saved.enabled.forEach(name => createDomain(name));
    }

    // Then enable them
    if (Array.isArray(saved.domains)) {
        saved.domains.forEach(name => enable(name));
    } else if (Array.isArray(saved.enabled)) {
        saved.enabled.forEach(name => enable(name));
    }
}

function enable(name) {
    // Create domain if it doesn't exist
    if (!domains.has(name)) {
        createDomain(name);
    }
    
    debug.enable(name);
    // Notify setters
    if (domains.has(name)) {
        domains.get(name).setters.forEach(setter => setter(debug.enabled(name)));
    }
}

function disable(name) {
    debug.disable(name);
    // Notify setters of current state
    if (domains.has(name)) {
        domains.get(name).setters.forEach(setter => setter(false));
    }
}

function filterTraces(rawTraces, options = {}) {
    const filtered = rawTraces.filter(trace => {
        // Filter by enabled domains
        if (options.enabledOnly && !isEnabled(trace.domain)) {
            return false;
        }
        // Filter by domain pattern
        if (options.pattern) {
            const regex = new RegExp(options.pattern.replace(/\*/g, '.*'));
            return regex.test(trace.domain);
        }
        // Filter by time range
        if (options.from && trace.timestamp < options.from) {
            return false;
        }
        if (options.to && trace.timestamp > options.to) {
            return false;
        }
        return true;
    });

    return filtered;
}

function loadTraces(serializedTraces) {
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
        if (!domains.has(domain)) {
            createDomain(domain);
        }
    });

    // Validate and reconstruct traces
    return serializedTraces.map(trace => ({
        timestamp: trace.timestamp || Date.now(),
        domain: trace.domain || 'unknown',
        args: Array.isArray(trace.args) ? trace.args : [trace.args],
        error: trace.error || new Error()
    }));
}

function attachFlag(bug, name, setter) {
    if (typeof setter !== 'function') {
        throw new Error('flag() requires a setter function');
    }
    // Set initial state
    setter(debug.enabled(name));
    // Add setter to domain
    domains.get(name).setters.add(setter);
    return bug;
}

function domain(name) {
    const bug = createDomain(name);
    const debugFn = (...args) => {
        if (debug.enabled(name)) {
            return addTrace(name, args);
        }
    };
    
    // Add flag support
    debugFn.flag = (setter) => {
        if (typeof setter !== 'function') {
            throw new Error('flag() requires a setter function');
        }
        setter(debug.enabled(name));
        domains.get(name).setters.add(setter);
        return debugFn;
    };
    
    return debugFn;
}

function flag(setter) {
    return (name) => domain(name).flag(setter);
}

const denbug = {
    domain,
    flag,
    enable,
    disable,
    configure: options => {
        if (options.maxTraces) config.maxTraces = options.maxTraces;
    },
    traces: () => [...traces],
    decode: trace => ({
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
    }),
    domains: () => Array.from(domains.keys()),
    state: debug.enabled,
    effectiveState: debug.enabled,
    subscribe: subscriber => {
        subscribers.add(subscriber);
        return () => subscribers.delete(subscriber);
    },
    applyPattern,
    applyPatterns: patterns => {
        // First create all domains to ensure echo domains exist
        if (Array.isArray(patterns)) {
            patterns.forEach(p => {
                const name = p.startsWith('-') ? p.slice(1) : p;
                if (!name.includes('*')) createDomain(name);
            });
        } else if (patterns?.enabled || patterns?.disabled) {
            if (patterns.enabled) {
                patterns.enabled.forEach(p => {
                    if (!p.includes('*')) createDomain(p);
                });
            }
            if (patterns.disabled) {
                patterns.disabled.forEach(p => {
                    if (!p.includes('*')) createDomain(p);
                });
            }
        }

        // Save echo domain states
        const echoDomains = Array.from(domains.keys())
            .filter(name => name.endsWith(':echo'));
        
        // Reset patterns but preserve echo domains
        debug.disable('*');
        echoDomains.forEach(name => debug.enable(name));
        
        // Apply new patterns
        if (Array.isArray(patterns)) {
            patterns.forEach(p => applyPattern(p));
        } else if (typeof patterns === 'object') {
            if (patterns.enabled) {
                patterns.enabled.forEach(p => applyPattern(p));
            }
            if (patterns.disabled) {
                patterns.disabled.forEach(p => applyPattern(`-${p}`));
            }
        }
    },
    installConsoleInterceptors,
    restoreConsole,
    demand,
    saveConfig,
    loadConfig,
    filterTraces,
    loadTraces
};

module.exports = denbug;
module.exports.default = denbug;
