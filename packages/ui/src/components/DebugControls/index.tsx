import React from 'react';
import { useDebug } from '../../context/DebugContext';
import './DebugControls.css';

export const DebugControls: React.FC = () => {
  const { 
    currentTraceIndex,
    traces,
    setCurrentTrace,
    selectedStackFrame,
    setSelectedStackFrame
  } = useDebug();

  const stepToTrace = (index: number) => {
    setCurrentTrace(index);
    setSelectedStackFrame(null);
  };

  return (
    <div className="debug-controls">
      <div className="debug-toolbar">
        <button 
          onClick={() => stepToTrace(0)}
          disabled={currentTraceIndex <= 0}
          title="Go to Start"
        >⏮️</button>
        
        <button 
          onClick={() => stepToTrace(currentTraceIndex - 1)}
          disabled={currentTraceIndex <= 0}
          title="Step Back"
        >⬅️</button>
        
        <button 
          onClick={() => stepToTrace(currentTraceIndex + 1)}
          disabled={currentTraceIndex >= traces.length - 1}
          title="Step Forward"
        >➡️</button>
        
        <button 
          onClick={() => stepToTrace(traces.length - 1)}
          disabled={currentTraceIndex >= traces.length - 1}
          title="Go to End"
        >⏭️</button>

        <span className="trace-position">
          Trace {currentTraceIndex + 1} of {traces.length}
        </span>
      </div>

      {traces[currentTraceIndex] && (
        <div className="current-trace">
          <div className="trace-info">
            <span className="domain">{traces[currentTraceIndex].domain}</span>
            <span className="args">{JSON.stringify(traces[currentTraceIndex].args)}</span>
          </div>
          <div className="stack-frames">
            {traces[currentTraceIndex].stack.map((frame, i) => (
              <div 
                key={i}
                className={`stack-frame ${selectedStackFrame === i ? 'selected' : ''}`}
                onClick={() => setSelectedStackFrame(i)}
              >
                <span className="function">{frame.function}</span>
                <span className="location">
                  {frame.file}:{frame.line}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};