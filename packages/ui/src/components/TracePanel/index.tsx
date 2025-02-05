import React, { useRef, useEffect } from 'react';
import { useDebug } from '../../context/DebugContext';
import './TracePanel.css';

export const TracePanel: React.FC = () => {
    const { 
        traces, 
        currentTraceIndex, 
        setCurrentTrace, 
        isFollowing 
    } = useDebug();
    
    // Add more detailed logging
    console.log('[TracePanel] Rendering:', { 
        hasTraces: traces && traces.length > 0,
        traces: traces?.map(t => ({ 
            id: t.id, 
            domain: t.domain,
            args: t.args 
        })),
        currentTrace: currentTraceIndex,
        following: isFollowing
    });

    const contentRef = useRef<HTMLDivElement>(null);

    // Auto-scroll when following or new traces arrive
    useEffect(() => {
        if (isFollowing && contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [traces.length, isFollowing]);

    // Add empty state handling
    if (!traces || traces.length === 0) {
        return (
            <div className="trace-panel">
                <div className="empty-state">
                    No traces available. Use debug("domain", args) to add traces.
                </div>
            </div>
        );
    }

    return (
        <div className="trace-panel">
            {!isFollowing && (
                <div className="trace-toolbar">
                    <button className="refresh-button">
                        🔄 Refresh
                    </button>
                </div>
            )}
            <div ref={contentRef} className="trace-list">
                {traces.map((trace, index) => (
                    <div 
                        key={trace.id}
                        className={`trace-item ${currentTraceIndex === index ? 'selected' : ''}`}
                        onClick={() => setCurrentTrace(index)}
                    >
                        <span className="trace-time">
                            {new Date(trace.timestamp).toISOString().split('T')[1].split('.')[0]}
                        </span>
                        <span className="trace-domain">{trace.domain}:</span>
                        <span className="trace-args">
                            {JSON.stringify(trace.args)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};