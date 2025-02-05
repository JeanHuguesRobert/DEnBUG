import { useDebug } from '../contexts/DebugContext';
import { useCallback } from 'react';

export const useTracePlayback = () => {
  const { 
    isPlaying, 
    playbackSpeed, 
    startPlayback, 
    stopPlayback, 
    setPlaybackSpeed,
    selectedTrace,
    traces
  } = useDebug();

  const canPlay = traces.length > 0;
  const canStepForward = selectedTrace && traces.indexOf(selectedTrace) < traces.length - 1;
  const canStepBack = selectedTrace && traces.indexOf(selectedTrace) > 0;

  const stepForward = useCallback(() => {
    if (!canStepForward || !selectedTrace) return;
    const currentIndex = traces.indexOf(selectedTrace);
    const nextTrace = traces[currentIndex + 1];
    if (nextTrace) {
      selectTrace(nextTrace);
    }
  }, [traces, selectedTrace, canStepForward]);

  const stepBack = useCallback(() => {
    if (!canStepBack || !selectedTrace) return;
    const currentIndex = traces.indexOf(selectedTrace);
    const prevTrace = traces[currentIndex - 1];
    if (prevTrace) {
      selectTrace(prevTrace);
    }
  }, [traces, selectedTrace, canStepBack]);

  return {
    isPlaying,
    playbackSpeed,
    canPlay,
    canStepForward,
    canStepBack,
    startPlayback,
    stopPlayback,
    setPlaybackSpeed,
    stepForward,
    stepBack
  };
};