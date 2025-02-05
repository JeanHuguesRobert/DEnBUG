import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Domain, Trace } from '@denbug/core';

interface DebugContextState {
  traces: Trace[];
  domains: Domain[];
  selectedTrace: Trace | null;
  selectedStackFrame: number | null;
  filters: {
    domain?: string;
    type?: string[];
    search?: string;
    active?: boolean;
  };
  isPlaying: boolean;
  playbackSpeed: number;
}

interface DebugContextValue extends DebugContextState {
  addTrace: (trace: Trace) => void;
  clearTraces: () => void;
  toggleDomain: (domain: string) => void;
  setFilters: (filters: Partial<DebugContextState['filters']>) => void;
  selectTrace: (trace: Trace | null) => void;
  selectStackFrame: (frame: number | null) => void;
  startPlayback: () => void;
  stopPlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  exportTraces: () => string;
  importTraces: (data: string) => void;
}

const DebugContext = createContext<DebugContextValue | null>(null);

export const DebugProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DebugContextState>({
    traces: [],
    domains: [],
    selectedTrace: null,
    selectedStackFrame: null,
    filters: {},
    isPlaying: false,
    playbackSpeed: 1
  });

  const playbackTimer = useRef<number>();

  const addTrace = useCallback((trace: Trace) => {
    setState(prev => ({
      ...prev,
      traces: [...prev.traces, trace],
      domains: updateDomains(prev.domains, trace.domain)
    }));
  }, []);

  const updateDomains = (domains: Domain[], newDomain: string): Domain[] => {
    if (domains.some(d => d.name === newDomain)) {
      return domains;
    }
    return [...domains, { name: newDomain, enabled: true }];
  };

  const clearTraces = useCallback(() => {
    setState(prev => ({
      ...prev,
      traces: [],
      selectedTrace: null,
      selectedStackFrame: null
    }));
  }, []);

  const toggleDomain = useCallback((domain: string) => {
    setState(prev => ({
      ...prev,
      domains: prev.domains.map(d => 
        d.name === domain ? { ...d, enabled: !d.enabled } : d
      )
    }));
  }, []);

  const startPlayback = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const stopPlayback = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false }));
    if (playbackTimer.current) {
      window.clearInterval(playbackTimer.current);
    }
  }, []);

  useEffect(() => {
    if (state.isPlaying) {
      playbackTimer.current = window.setInterval(() => {
        setState(prev => {
          const currentIndex = prev.traces.findIndex(t => t === prev.selectedTrace);
          const nextIndex = currentIndex + 1;
          if (nextIndex >= prev.traces.length) {
            stopPlayback();
            return prev;
          }
          return {
            ...prev,
            selectedTrace: prev.traces[nextIndex],
            selectedStackFrame: null
          };
        });
      }, 1000 / state.playbackSpeed);
    }
    return () => {
      if (playbackTimer.current) {
        window.clearInterval(playbackTimer.current);
      }
    };
  }, [state.isPlaying, state.playbackSpeed]);

  const exportTraces = useCallback(() => {
    return JSON.stringify({
      traces: state.traces,
      domains: state.domains
    });
  }, [state.traces, state.domains]);

  const importTraces = useCallback((data: string) => {
    try {
      const { traces, domains } = JSON.parse(data);
      setState(prev => ({
        ...prev,
        traces,
        domains,
        selectedTrace: null,
        selectedStackFrame: null
      }));
    } catch (e) {
      console.error('Failed to import traces:', e);
    }
  }, []);

  const value: DebugContextValue = {
    ...state,
    addTrace,
    clearTraces,
    toggleDomain,
    setFilters: filters => setState(prev => ({ ...prev, filters: { ...prev.filters, ...filters } })),
    selectTrace: trace => setState(prev => ({ ...prev, selectedTrace: trace })),
    selectStackFrame: frame => setState(prev => ({ ...prev, selectedStackFrame: frame })),
    startPlayback,
    stopPlayback,
    setPlaybackSpeed: speed => setState(prev => ({ ...prev, playbackSpeed: speed })),
    exportTraces,
    importTraces
  };

  return (
    <DebugContext.Provider value={value}>
      {children}
    </DebugContext.Provider>
  );
};

export const useDebug = () => {
  const context = useContext(DebugContext);
  if (!context) throw new Error('useDebug must be used within DebugProvider');
  return context;
};