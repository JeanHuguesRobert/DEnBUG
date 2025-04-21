import React from 'react';
import { useDebug } from '../../contexts/DebugContext';
import './StepControls.css';

export const StepControls: React.FC = () => {
    const { 
        traces, 
        currentTraceIndex, 
        setCurrentTrace, 
        isFollowing, 
        setIsFollowing 
    } = useDebug();

    const handleFirst = () => {
        setIsFollowing(false);
        setCurrentTrace(0);
    };

    const handlePrev = () => {
        setIsFollowing(false);
        setCurrentTrace(Math.max(0, currentTraceIndex - 1));
    };

    const handleNext = () => {
        setIsFollowing(false);
        setCurrentTrace(Math.min(traces.length - 1, currentTraceIndex + 1));
    };

    const handleLast = () => {
        setIsFollowing(true);
        setCurrentTrace(traces.length - 1);
    };

    return (
        <div className="step-controls">
            <button 
                onClick={handleFirst}
                disabled={currentTraceIndex === 0}
                title="First (Home)"
            >
                ⏮️
            </button>
            <button 
                onClick={handlePrev}
                disabled={currentTraceIndex === 0}
                title="Previous (←)"
            >
                ⏪
            </button>
            <button 
                onClick={handleNext}
                disabled={currentTraceIndex === traces.length - 1}
                title="Next (→)"
            >
                ⏩
            </button>
            <button 
                onClick={handleLast}
                disabled={isFollowing}
                title="Last/Follow (End)"
            >
                ⏭️
            </button>
        </div>
    );
};