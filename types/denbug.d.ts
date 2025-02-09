// Public API types for denbug

export interface DomainState {
    name: string;
    localEnabled: boolean;
    effectiveEnabled: boolean;
    echo: boolean;
    setters: Set<(v: boolean) => void>;
}

export interface Trace {
    id: string;
    timestamp: number;
    domain: string;
    args: any[];
    error: Error;
    structured: Record<string, any>;
}

export interface TraceFilter {
    pattern?: string;
    enabledOnly?: boolean;
    from?: number;
    to?: number;
    structured?: Record<string, any>;
}

export interface Denbug {
    domain(name: string): Denbug;
    flag(setter: (enabled: boolean) => void): (domain: string) => Denbug;
    enable(name: string | string[]): void;
    disable(name: string | string[]): void;
    state(name: string, newState?: boolean): boolean | Denbug;
    traces(): Trace[];
    clear(): void;
    decode(trace: Trace): {
        id: string;
        timestamp: string;
        domain: string;
        args: any[];
        stack: Array<{
            function: string;
            file: string;
            line: number;
            column: number;
        }>;
    };
    subscribe(subscriber: (event: string, ...args: any[]) => void): () => void;
    save(): any;
    load(configuration: any): void;
    filter(traces: Trace[], options?: TraceFilter): Trace[];
    post(serializedTraces: string | Trace[]): Trace[];
    parseStructuredTrace(trace: Trace): Trace;
    filterStructuredTraces(traces: Trace[], key: string, value: any): Trace[];
    setContractsEnabled(value: boolean): void;
}

declare const denbug: Denbug;
export default denbug;
