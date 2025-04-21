import React, { useState, useEffect } from 'react';
import denbug from 'denbug';
import { useDomain } from '../../contexts/DomainContext';
import './DomainSelector.css';

interface DomainNode {
    name: string;
    children?: DomainNode[];
}

export const DomainSelector: React.FC = () => {
    const { filters, setFilters } = useDomain();
    const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
    const [, forceUpdate] = useState({});

    useEffect(() => {
        const unsubscribe = denbug.subscribe(() => {
            forceUpdate({});
        });
        return () => unsubscribe();
    }, []);

    const buildDomainTree = (): DomainNode[] => {
        const allDomains: string[] = denbug.domains();
        const filtered = allDomains.filter((name: string) => !name.endsWith('.echo'));
        const tree: DomainNode[] = [];
        const domainMap: { [key: string]: DomainNode } = {};

        filtered.forEach((name: string) => {
            const node: DomainNode = { name, children: [] };
            domainMap[name] = node;
            const parts = name.split(':');
            if (parts.length > 1) {
                const parentName = parts.slice(0, -1).join(':');
                if (domainMap[parentName]) {
                    domainMap[parentName].children!.push(node);
                    return;
                }
            }
            tree.push(node);
        });

        return tree;
    };

    const renderDomain = (domain: DomainNode, depth = 0) => {
        if (!domain.name.toLowerCase().includes(filters.domain?.toLowerCase() || '')) {
            return null;
        }

        const hasEcho = Boolean(denbug.state(domain.name + '.echo') === true);
        const hasChildren = domain.children && domain.children.length > 0;
        const isExpanded = expandedDomains.has(domain.name);

        return (
            <div key={domain.name} className="domain-item" style={{ paddingLeft: `${depth * 20}px` }}>
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
                            checked={Boolean(denbug.state(domain.name) === true)}
                            onChange={() => {
                                if (denbug.state(domain.name)) {
                                    denbug.disable(domain.name);
                                } else {
                                    denbug.enable(domain.name);
                                }
                            }}
                        />
                        {domain.name}
                    </label>
                    {hasEcho && (
                        <label className="echo-label" title="Echo to console">
                            <input
                                type="checkbox"
                                checked={Boolean(denbug.state(domain.name + '.echo') === true)}
                                onChange={() => {
                                    if (denbug.state(domain.name + '.echo')) {
                                        denbug.disable(domain.name + '.echo');
                                    } else {
                                        denbug.enable(domain.name + '.echo');
                                    }
                                }}
                            />
                            🔊
                        </label>
                    )}
                </div>
                {isExpanded && domain.children!.map(child => renderDomain(child, depth + 1))}
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
                <button
                    onClick={() => {
                        expandedDomains.size === 0
                            ? setExpandedDomains(new Set(denbug.domains()))
                            : setExpandedDomains(new Set());
                    }}
                    title="Expand/Collapse all"
                >
                    {expandedDomains.size === 0 ? '⮬' : '⮭'}
                </button>
                <button onClick={() => denbug.enable('*.echo')} title="Enable all echoes">
                    🔊
                </button>
                <button onClick={() => denbug.disable('*.echo')} title="Disable all echoes">
                    🔇
                </button>
            </div>
            <div className="domain-list">
                {tree.map(domain => renderDomain(domain))}
            </div>
        </div>
    );
};