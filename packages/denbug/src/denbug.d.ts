export interface BugFunction {
    (...args: any[]): any;
    flag(setter: StateChangeHandler): BugFunction;
}

export type StateChangeHandler = (enabled: boolean) => void;

export interface TraceFilterOptions {
    enabledOnly?: boolean;
    pattern?: string;
    from?: number;
    to?: number;
}

export interface DecodedTrace {
    id: string;
    timestamp: string;
    domain: string;
    args: any[];
    stack: StackFrame[];
}

export interface StackFrame {
    function: string;
    file: string;
    line: number;
    column: number;
}

export interface RawTrace {
    timestamp: number;
    domain: string;
    args: any[];
    error?: Error;
}

export interface DomainEvent {
    type: 'created' | 'stateChanged' | 'traceAdded';
    domain: string;
    enabled: boolean;
    trace: RawTrace;
}

export type PatternType = 
    | 'exact'
    | 'recursive'
    | 'suffix'
    | 'negation';

export interface Pattern {
    type: PatternType;
    pattern: string;
    enable: boolean;
}

export interface Config {
    version: string;
    timestamp: number;
    maxTraces?: number;
    domains: string[];
    patterns?: {
        enabled?: string[];
        disabled?: string[];
    };
}

export interface Denbug {
    /**
     * Creates a debug domain with optional chaining for flag attachment
     * @param name Domain name
     */
    domain(name: string): BugFunction;

    /**
     * Creates a domain with a flag setter for zero-cost debugging
     * @param setter Function to update the flag variable
     */
    flag(setter: StateChangeHandler): (name: string) => BugFunction;

    enable(name: string): void;
    disable(name: string): void;
    configure(options: { maxTraces?: number }): void;
    traces(): any[];
    decode(trace: any): DecodedTrace;
    domains(): string[];
    state(name: string): boolean;
    effectiveState(name: string): boolean;
    subscribe(subscriber: (event: string, ...args: any[]) => void): () => void;
    applyPattern(pattern: string): void;
    applyPatterns(patterns: { enabled?: string[], disabled?: string[] }): void;
    installConsoleInterceptors(): void;
    restoreConsole(): void;
    demand(name: string): BugFunction;
    saveConfig(): any;
    loadConfig(saved: any): void;
    filterTraces(rawTraces: any[], options?: TraceFilterOptions): any[];
    loadTraces(serializedTraces: string | any[]): any[];
}

declare namespace debug {
    type DomainCallback<T = void> = (...args: any[]) => T;
    type FlagCallback = (enabled: boolean) => void;

    interface Domain {
        <T = void>(...args: any[]): T;
        flag(callback: FlagCallback): DomainCallback;
    }

    function domain(namespace: string): Domain;
    function flag(callback: FlagCallback): (namespace: string) => DomainCallback;
    function enable(namespace: string): void;
    function disable(namespace: string): void;
    function enabled(namespace: string): boolean;
    function domains(): string[];
    function configure(options: { maxTraces?: number }): void;
    function traces(): RawTrace[];
    function decode(trace: RawTrace): DecodedTrace;
    function state(name: string): boolean;
    function effectiveState(name: string): boolean;
    function subscribe(subscriber: (event: DomainEvent) => void): () => void;
    function applyPattern(pattern: string): void;
    function applyPatterns(patterns: string[] | { enabled?: string[], disabled?: string[] }): void;
    function installConsoleInterceptors(): void;
    function restoreConsole(): void;
    function demand(name: string): (condition: boolean, ...args: any[]) => boolean;
    function saveConfig(): Config;
    function loadConfig(config: Config): void;
    function filterTraces(traces: RawTrace[], options?: TraceFilterOptions): RawTrace[];
    function loadTraces(traces: string | RawTrace[]): RawTrace[];
}

export = debug;

declare const denbug: Denbug;
export default denbug;
