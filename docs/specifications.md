# Denbug Project Specifications

## Project Overview

### Purpose
Denbug is a professional-grade debugging toolkit that extends the `debug` package, providing:
1. Hierarchical tracing system
2. Visual debugging interface
3. Time-travel debugging capabilities
4. Rich stack trace analysis

### Deliverables
1. Core Library Package (`denbug`)
2. Visual Debugger Package (`@denbug/ui`)
3. Complete TypeScript definitions
4. Comprehensive test suite
5. Documentation and examples

## Technical Architecture

### 1. Core Library (`denbug`)

#### Domain System
```typescript
interface DomainState {
    name: string;                           // Full domain path (e.g., "app:ui:button")
    enabled: boolean;                       // Current state
    echo: boolean;                         // Console output state
    getter: () => boolean;                 // State accessor
    setters: Array<(v: boolean) => void>;  // State mutators
    debugInstance: any;                    // Underlying debug instance
    parent?: string;                       // Parent domain reference
    children: string[];                    // Child domain references
}

interface DomainManager {
    create(name: string, getter: () => boolean, setter: (v: boolean) => void): void;
    enable(pattern: string): void;
    disable(pattern: string): void;
    state(name: string): boolean;
    list(): string[];
    hierarchy(): DomainHierarchy;
}

interface DomainHierarchy {
    [key: string]: {
        state: DomainState;
        children: DomainHierarchy;
    };
}
```

#### Trace System
```typescript
interface Trace {
    id: string;              // Unique identifier
    timestamp: number;       // Unix timestamp (ms)
    domain: string;         // Source domain
    args: any[];           // Captured arguments
    stack: StackFrame[];   // Call stack
    metadata?: {           // Optional context
        pid?: number;
        tid?: number;
        memory?: number;
        performance?: PerformanceEntry[];
    };
}

interface StackFrame {
    function: string;     // Function name
    file: string;        // Source file
    line: number;        // Line number (1-based)
    column: number;      // Column (1-based)
    sourceMap?: {        // Source map data
        original: {
            file: string;
            line: number;
            column: number;
        };
    };
}

interface TraceManager {
    add(trace: Trace): void;
    get(id: string): Trace | null;
    list(filter?: TraceFilter): Trace[];
    clear(): void;
    export(): string;    // JSON format
    import(data: string): void;
}

interface TraceFilter {
    domain?: string | RegExp;
    start?: number;      // Timestamp
    end?: number;        // Timestamp
    limit?: number;
    types?: ('log' | 'info' | 'warn' | 'error' | 'assert')[];
}
```

### 2. Visual Interface (`@denbug/ui`)

#### Component Hierarchy
```
AppRoot
├── AppBar
│   ├── ThemeToggle
│   ├── TraceControls
│   └── ExportMenu
├── MainLayout
│   ├── DomainTree
│   │   ├── DomainNode
│   │   └── EchoToggle
│   └── ContentArea
│       ├── FilterBar
│       ├── TabPanel
│       └── ContentView
│           ├── TraceView
│           ├── DomainView
│           └── StackView
└── StatusBar
```

#### Key Components

##### DomainTree
```typescript
interface DomainTreeProps {
    domains: DomainHierarchy;
    onToggleDomain: (name: string) => void;
    onToggleEcho: (name: string) => void;
    onDomainSelect: (name: string) => void;
    selectedDomain?: string;
    filter?: string;
    expandedNodes?: Set<string>;
}
```

##### TraceView
```typescript
interface TraceViewProps {
    traces: Trace[];
    currentIndex: number;
    onTraceSelect: (id: string) => void;
    onStackFrameSelect: (traceId: string, frameIndex: number) => void;
    filters: TraceFilter;
    groupBy?: 'time' | 'domain' | 'type';
    virtualizeOptions?: {
        itemSize: number;
        overscan: number;
        threshold: number;
    };
}
```

#### State Management
```typescript
interface AppState {
    theme: 'light' | 'dark';
    layout: {
        domainTreeWidth: number;
        selectedTab: number;
        splitPanelSizes: number[];
    };
    filters: TraceFilter & {
        showInactive: boolean;
        showStack: boolean;
    };
    selection: {
        domain?: string;
        trace?: string;
        stackFrame?: number;
    };
    preferences: {
        autoScroll: boolean;
        timeFormat: '24h' | '12h';
        stackTraceDepth: number;
        maxTraces: number;
    };
}
```

## Performance Requirements

### Core Library
- Trace buffer operations: O(1)
- Domain lookups: O(1)
- Pattern matching: O(log n)
- Memory usage: < 100MB for 10k traces
- CPU usage: < 1% idle, < 5% active

### UI Performance
- Initial load: < 1s
- Trace list scrolling: 60fps
- Filter updates: < 100ms
- Domain tree updates: < 50ms
- Memory usage: < 200MB

## Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest version)

## Testing Coverage Requirements
- Core Library: > 95%
- UI Components: > 90%
- Integration Tests: > 85%
- E2E Tests: Key user flows

## Documentation Requirements
1. API Documentation
   - JSDoc for all public APIs
   - TypeScript definitions
   - Usage examples
   - Error handling guide

2. UI Documentation
   - Component storybook
   - Theme customization guide
   - Performance optimization tips
   - Troubleshooting guide

## Delivery Milestones

### Phase 1: Core Library (4 weeks)
- Basic domain management
- Trace capture system
- TypeScript definitions
- Initial tests

### Phase 2: UI Foundation (4 weeks)
- Component architecture
- Basic layouts
- State management
- Theme system

### Phase 3: Advanced Features (4 weeks)
- Time-travel debugging
- Performance optimizations
- Advanced filtering
- Export/Import

### Phase 4: Polish (2 weeks)
- Documentation
- Testing
- Performance tuning
- Bug fixes

## Acceptance Criteria
[Detailed acceptance criteria for each feature...]