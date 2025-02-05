import React, { useState, useEffect } from 'react';
import debug from '../../lib/denbug';
import './DomainSelector.css';

interface DomainNode {
    name: string;
    children?: DomainNode[];
    isExpanded?: boolean;
}

export const DomainSelector: React.FC = () => {
    const { filters, setFilters } = useDebug();
    const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
    const [, forceUpdate] = useState({});

    // Subscribe to domain changes to trigger re-render
    useEffect(() => {
        const unsubscribe = debug.subscribe(() => {
            forceUpdate({});
        });
        return () => unsubscribe();
    }, []);

    // Build domain tree directly from denbug
    const buildDomainTree = (): DomainNode[] => {
        const allDomains = debug.domains()
            .filter(name => !name.endsWith('.echo'));
        
        const tree: DomainNode[] = [];
        const domainMap: { [key: string]: DomainNode } = {};

        allDomains.forEach(name => {
            const domain: DomainNode = {
                name,
                children: []
            };
            domainMap[name] = domain;

            const parts = name.split('.');
            if (parts.length > 1) {
                const parentName = parts.slice(0, -1).join('.');
                if (domainMap[parentName]) {
                    domainMap[parentName].children?.push(domain);
                    return;
                }
            }
            tree.push(domain);
        });

        return tree;
    };

    const renderDomain = (domain: DomainNode, depth = 0) => {
        if (!domain.name.toLowerCase().includes(filters.domain?.toLowerCase() || '')) {
            return null;
        }

        const hasEcho = debug.state(domain.name + '.echo') !== undefined;
        const hasChildren = domain.children?.length > 0;
        const isExpanded = expandedDomains.has(domain.name);

        return (
            <div key={domain.name} 
                className="domain-item" 
                style={{ paddingLeft: `${depth * 20}px` }}>
                <div className="domain-controls">
                    {hasChildren && (
                        <span 
                            className="domain-expander"
                            onClick={() => {
                                const newExpanded = new Set(expandedDomains);
                                if (isExpanded) {
                                    newExpanded.delete(domain.name);
                                } else {
                                    newExpanded.add(domain.name);
                                }
                                setExpandedDomains(newExpanded);
                            }}
                        >
                            {isExpanded ? '▼' : '▶'}
                        </span>
                    )}
                    <label className="domain-label">
                        <input
                            type="checkbox"
                            checked={debug.state(domain.name)}
                            onChange={() => {
                                if (debug.state(domain.name)) {
                                    debug.disable(domain.name);
                                } else {
                                    debug.enable(domain.name);
                                }
                            }}
                        />
                        {domain.name}
                    </label>
                    {hasEcho && (
                        <label className="echo-label" title="Echo to console">
                            <input
                                type="checkbox"
                                checked={debug.state(domain.name + '.echo')}
                                onChange={() => {
                                    if (debug.state(domain.name + '.echo')) {
                                        debug.disable(domain.name + '.echo');
                                    } else {
                                        debug.enable(domain.name + '.echo');
                                    }
                                }}
                            />
                            🔊
                        </label>
                    )}
                </div>
                {isExpanded && domain.children?.map(child => renderDomain(child, depth + 1))}
            </div>
        );
    };

    const tree = buildDomainTree();

    return (
        <div className="domain-selector">
            <div className="domain-toolbar">
                <input
                    type="text"
                    placeholder="Filter domains..."
                    value={filters.domain || ''}
                    onChange={e => setFilters({ domain: e.target.value })}
                />
                <button onClick={() => {
                    // Expand/Collapse all
                    expandedDomains.size === 0 ? 
                        setExpandedDomains(new Set(debug.domains())) : 
                        setExpandedDomains(new Set())
                }} title="Expand/Collapse all">
                    {expandedDomains.size === 0 ? '⮬' : '⮭'}
                </button>
                <button onClick={() => debug.enable('*.echo')} title="Enable all echoes">
                    🔊
                </button>
                <button onClick={() => debug.disable('*.echo')} title="Disable all echoes">
                    🔇
                </button>
            </div>
            <div className="domain-list">
                {tree.map(domain => renderDomain(domain))}
            </div>
        </div>
    );
};