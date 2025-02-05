import React, { useEffect } from 'react';
import { TracePanel } from '../TracePanel';
import { StackPanel } from '../StackPanel';
import { SourcePanel } from '../SourcePanel';
import { Calculator } from '../Calculator';
import { useDebug } from '../../context/DebugContext';
import { DebugBanner } from '../DebugBanner';
import './Debugger.css';

export const Debugger: React.FC = () => {
    const { 
        currentTraceIndex,
        traces,
        setCurrentTrace,
        isFollowing,
        setIsFollowing
    } = useDebug();

    // Add keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                setCurrentTrace(Math.max(0, currentTraceIndex - 1));
            } else if (e.key === 'ArrowRight') {
                setCurrentTrace(Math.min(traces.length - 1, currentTraceIndex + 1));
            } else if (e.key === 'Home') {
                setCurrentTrace(0);
            } else if (e.key === 'End') {
                setCurrentTrace(traces.length - 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentTraceIndex, traces.length, setCurrentTrace]);

    return (
        <div className="debugger">
            <DebugBanner />
            <div className="debugger-toolbar">
                <button 
                    title="First (Home)"
                    onClick={() => setCurrentTrace(0)}
                    disabled={currentTraceIndex <= 0}
                >⏮️</button>
                <button 
                    title="Previous (←)"
                    onClick={() => setCurrentTrace(currentTraceIndex - 1)}
                    disabled={currentTraceIndex <= 0}
                >⬅️</button>
                <button 
                    title="Next (→)"
                    onClick={() => setCurrentTrace(currentTraceIndex + 1)}
                    disabled={currentTraceIndex >= traces.length - 1}
                >➡️</button>
                <button 
                    title="Last (End)"
                    onClick={() => setCurrentTrace(traces.length - 1)}
                    disabled={currentTraceIndex >= traces.length - 1}
                >⏭️</button>
                
                <button 
                    title="Toggle Auto-follow"
                    className={isFollowing ? 'active' : ''}
                    onClick={() => setIsFollowing(!isFollowing)}
                >{isFollowing ? '⏸️' : '▶️'}</button>
                
                <span className="trace-counter">
                    {currentTraceIndex + 1} / {traces.length}
                </span>
            </div>
            
            <div className="debugger-content">
                <div className="debugger-left">
                    <TracePanel />
                    <StackPanel />
                </div>
                
                <div className="debugger-right">
                    <SourcePanel />
                    <Calculator />
                </div>
            </div>
            
            <div className="debugger-status">
                Ready
            </div>
        </div>
    );
};