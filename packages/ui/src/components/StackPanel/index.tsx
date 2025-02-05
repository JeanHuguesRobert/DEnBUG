import React from 'react';
import { useEffect, useState } from 'react';
import { useDebug } from '../../context/DebugContext';
import { decodeStackFrames } from '../../lib/sourceMapService';
import './StackPanel.css';

export const StackPanel: React.FC = () => {
    const { traces, currentTraceIndex, selectedStackFrame, setSelectedStackFrame } = useDebug();
    const [decodedFrames, setDecodedFrames] = useState<any[]>([]);

    useEffect(() => {
        const currentTrace = traces[currentTraceIndex];
        if (!currentTrace?.stack) {
            setDecodedFrames([]);
            return;
        }

        decodeStackFrames(currentTrace.stack)
            .then(frames => setDecodedFrames(frames))
            .catch(err => console.error('Failed to decode frames:', err));
    }, [traces, currentTraceIndex]);

    if (!decodedFrames.length) {
        return (
            <div className="stack-panel">
                <div className="empty-state">
                    No stack trace available
                </div>
            </div>
        );
    }

    return (
        <div className="stack-panel">
            {decodedFrames.map((frame, index) => (
                <div 
                    key={index}
                    className={`stack-frame ${selectedStackFrame === index ? 'selected' : ''}`}
                    onClick={() => setSelectedStackFrame(index)}
                >
                    <span className="frame-function">{frame.function}</span>
                    <span className="frame-location">
                        {frame.file}:{frame.line}
                    </span>
                    {frame.code && (
                        <pre className="frame-code">{frame.code}</pre>
                    )}
                </div>
            ))}
        </div>
    );
};