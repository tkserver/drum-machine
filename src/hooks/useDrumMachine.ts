import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Pattern, 
  Arrangement, 
  ArrangementBlock,
  TransportState, 
  ViewMode,
  DEFAULT_SOUNDS 
} from '@/types/drumMachine';
import { useAudioEngine } from './useAudioEngine';

const createEmptyPattern = (id: string, name: string, length: number = 16): Pattern => ({
  id,
  name,
  length,
  swing: 0,
  tracks: DEFAULT_SOUNDS.map((sound) => ({
    id: `${id}-${sound.id}`,
    soundId: sound.id,
    steps: Array(64).fill(null).map(() => ({ active: false, velocity: 1 })),
    muted: false,
    solo: false,
    volume: 1,
  })),
});

const createEmptyArrangement = (): Arrangement => ({
  id: 'arr-1',
  name: 'Arrangement 1',
  blocks: [],
  totalBars: 16,
});

export const useDrumMachine = () => {
  const { isInitialized, sounds, initAudio, playSound } = useAudioEngine();
  
  const [viewMode, setViewMode] = useState<ViewMode>('pads');
  const [patterns, setPatterns] = useState<Pattern[]>([
    createEmptyPattern('pattern-1', 'Pattern 1', 16),
    createEmptyPattern('pattern-2', 'Pattern 2', 16),
    createEmptyPattern('pattern-3', 'Pattern 3', 16),
    createEmptyPattern('pattern-4', 'Pattern 4', 16),
  ]);
  const [currentPatternId, setCurrentPatternId] = useState('pattern-1');
  const [arrangement, setArrangement] = useState<Arrangement>(createEmptyArrangement());
  const [transport, setTransport] = useState<TransportState>({
    isPlaying: false,
    bpm: 120,
    currentStep: 0,
    currentBar: 0,
    timeSignature: '4/4',
    stepResolution: 16,
    tripletMode: 'straight',
  });
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  
  // Use refs for timing-critical values to avoid stale closure issues
  const isPlayingRef = useRef(false);
  const currentStepRef = useRef(0);
  const currentBarRef = useRef(0);
  const bpmRef = useRef(120);
  const stepResolutionRef = useRef(16);
  const tripletModeRef = useRef<'straight' | 'triplet'>('straight');
  const patternsRef = useRef(patterns);
  const currentPatternIdRef = useRef(currentPatternId);
  
  const intervalRef = useRef<number | null>(null);

  // Keep refs in sync with state
  useEffect(() => { isPlayingRef.current = transport.isPlaying; }, [transport.isPlaying]);
  useEffect(() => { bpmRef.current = transport.bpm; }, [transport.bpm]);
  useEffect(() => { stepResolutionRef.current = transport.stepResolution; }, [transport.stepResolution]);
  useEffect(() => { tripletModeRef.current = transport.tripletMode; }, [transport.tripletMode]);
  useEffect(() => { patternsRef.current = patterns; }, [patterns]);
  useEffect(() => { currentPatternIdRef.current = currentPatternId; }, [currentPatternId]);

  const currentPattern = patterns.find((p) => p.id === currentPatternId) || patterns[0];

  const getStepIntervalMs = useCallback(() => {
    const bpm = bpmRef.current;
    const resolution = stepResolutionRef.current;
    const triplet = tripletModeRef.current;
    
    // Calculate milliseconds per step
    const beatsPerMinute = bpm;
    const stepsPerBeat = resolution / 4;
    const msPerBeat = 60000 / beatsPerMinute;
    let msPerStep = msPerBeat / stepsPerBeat;
    
    if (triplet === 'triplet') {
      msPerStep = msPerStep * (2 / 3);
    }
    
    return msPerStep;
  }, []);

  const playCurrentStep = useCallback(() => {
    if (!isPlayingRef.current) return;
    
    const patterns = patternsRef.current;
    const patternId = currentPatternIdRef.current;
    const pattern = patterns.find((p) => p.id === patternId);
    if (!pattern) return;

    const step = currentStepRef.current;
    
    // Play all active sounds for this step
    pattern.tracks.forEach((track) => {
      if (track.muted) return;
      
      const stepData = track.steps[step];
      if (stepData?.active) {
        playSound(track.soundId, stepData.velocity * track.volume);
      }
    });

    // Advance step
    const nextStep = (step + 1) % pattern.length;
    const nextBar = nextStep === 0 ? currentBarRef.current + 1 : currentBarRef.current;
    
    currentStepRef.current = nextStep;
    currentBarRef.current = nextBar;
    
    // Update state for UI (throttled)
    setTransport((prev) => ({
      ...prev,
      currentStep: nextStep,
      currentBar: nextBar,
    }));
  }, [playSound]);

  const startPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Play first step immediately
    playCurrentStep();
    
    // Set up interval for subsequent steps
    const intervalMs = getStepIntervalMs();
    intervalRef.current = window.setInterval(() => {
      playCurrentStep();
    }, intervalMs);
  }, [playCurrentStep, getStepIntervalMs]);

  const stopPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Handle play state changes
  useEffect(() => {
    if (transport.isPlaying) {
      startPlayback();
    } else {
      stopPlayback();
    }

    return () => {
      stopPlayback();
    };
  }, [transport.isPlaying, startPlayback, stopPlayback]);

  // Update interval when BPM or resolution changes during playback
  useEffect(() => {
    if (transport.isPlaying && intervalRef.current) {
      stopPlayback();
      startPlayback();
    }
  }, [transport.bpm, transport.stepResolution, transport.tripletMode]);

  const togglePlay = useCallback(async () => {
    if (!isInitialized) {
      await initAudio();
    }
    
    setTransport((prev) => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  }, [isInitialized, initAudio]);

  const stop = useCallback(() => {
    currentStepRef.current = 0;
    currentBarRef.current = 0;
    setTransport((prev) => ({
      ...prev,
      isPlaying: false,
      currentStep: 0,
      currentBar: 0,
    }));
  }, []);

  const setBpm = useCallback((bpm: number) => {
    const clampedBpm = Math.max(20, Math.min(300, bpm));
    bpmRef.current = clampedBpm;
    setTransport((prev) => ({ ...prev, bpm: clampedBpm }));
  }, []);

  const setStepResolution = useCallback((resolution: 4 | 8 | 16 | 32) => {
    stepResolutionRef.current = resolution;
    setTransport((prev) => ({ ...prev, stepResolution: resolution }));
  }, []);

  const setTripletMode = useCallback((mode: 'straight' | 'triplet') => {
    tripletModeRef.current = mode;
    setTransport((prev) => ({ ...prev, tripletMode: mode }));
  }, []);

  const setTimeSignature = useCallback((sig: '4/4' | '3/4' | '6/8') => {
    setTransport((prev) => ({ ...prev, timeSignature: sig }));
  }, []);

  const toggleStep = useCallback((trackId: string, stepIndex: number) => {
    setPatterns((prev) =>
      prev.map((pattern) => {
        if (pattern.id !== currentPatternId) return pattern;
        
        return {
          ...pattern,
          tracks: pattern.tracks.map((track) => {
            if (track.id !== trackId) return track;
            
            const newSteps = [...track.steps];
            newSteps[stepIndex] = {
              ...newSteps[stepIndex],
              active: !newSteps[stepIndex].active,
            };
            return { ...track, steps: newSteps };
          }),
        };
      })
    );
  }, [currentPatternId]);

  const setStepVelocity = useCallback((trackId: string, stepIndex: number, velocity: number) => {
    setPatterns((prev) =>
      prev.map((pattern) => {
        if (pattern.id !== currentPatternId) return pattern;
        
        return {
          ...pattern,
          tracks: pattern.tracks.map((track) => {
            if (track.id !== trackId) return track;
            
            const newSteps = [...track.steps];
            newSteps[stepIndex] = { ...newSteps[stepIndex], velocity };
            return { ...track, steps: newSteps };
          }),
        };
      })
    );
  }, [currentPatternId]);

  const toggleTrackMute = useCallback((trackId: string) => {
    setPatterns((prev) =>
      prev.map((pattern) => {
        if (pattern.id !== currentPatternId) return pattern;
        
        return {
          ...pattern,
          tracks: pattern.tracks.map((track) => {
            if (track.id !== trackId) return track;
            return { ...track, muted: !track.muted };
          }),
        };
      })
    );
  }, [currentPatternId]);

  const toggleTrackSolo = useCallback((trackId: string) => {
    setPatterns((prev) =>
      prev.map((pattern) => {
        if (pattern.id !== currentPatternId) return pattern;
        
        return {
          ...pattern,
          tracks: pattern.tracks.map((track) => {
            if (track.id !== trackId) return track;
            return { ...track, solo: !track.solo };
          }),
        };
      })
    );
  }, [currentPatternId]);

  const setPatternLength = useCallback((length: number) => {
    setPatterns((prev) =>
      prev.map((pattern) => {
        if (pattern.id !== currentPatternId) return pattern;
        return { ...pattern, length };
      })
    );
  }, [currentPatternId]);

  const addPattern = useCallback(() => {
    const newId = `pattern-${patterns.length + 1}`;
    const newPattern = createEmptyPattern(newId, `Pattern ${patterns.length + 1}`);
    setPatterns((prev) => [...prev, newPattern]);
    return newPattern;
  }, [patterns.length]);

  const deletePattern = useCallback((patternId: string) => {
    if (patterns.length <= 1) return;
    
    setPatterns((prev) => prev.filter((p) => p.id !== patternId));
    if (currentPatternId === patternId) {
      setCurrentPatternId(patterns[0].id === patternId ? patterns[1].id : patterns[0].id);
    }
  }, [patterns, currentPatternId]);

  const addArrangementBlock = useCallback((patternId: string, startBar: number, trackRow: number = 0) => {
    const newBlock: ArrangementBlock = {
      id: `block-${Date.now()}`,
      patternId,
      startBar,
      length: 4,
    };
    
    setArrangement((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));
  }, []);

  const removeArrangementBlock = useCallback((blockId: string) => {
    setArrangement((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== blockId),
    }));
  }, []);

  const moveArrangementBlock = useCallback((blockId: string, newStartBar: number) => {
    setArrangement((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.id === blockId ? { ...b, startBar: Math.max(0, newStartBar) } : b
      ),
    }));
  }, []);

  const resizeArrangementBlock = useCallback((blockId: string, newLength: number) => {
    setArrangement((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.id === blockId ? { ...b, length: Math.max(1, newLength) } : b
      ),
    }));
  }, []);

  const setArrangementLength = useCallback((totalBars: number) => {
    setArrangement((prev) => ({
      ...prev,
      totalBars: Math.max(4, totalBars),
    }));
  }, []);

  const triggerPad = useCallback(async (soundId: string) => {
    if (!isInitialized) {
      await initAudio();
    }
    playSound(soundId);
  }, [isInitialized, initAudio, playSound]);

  return {
    // State
    viewMode,
    patterns,
    currentPattern,
    currentPatternId,
    arrangement,
    transport,
    sounds,
    selectedTrackId,
    isInitialized,
    
    // Actions
    setViewMode,
    setCurrentPatternId,
    togglePlay,
    stop,
    setBpm,
    setStepResolution,
    setTripletMode,
    setTimeSignature,
    toggleStep,
    setStepVelocity,
    toggleTrackMute,
    toggleTrackSolo,
    setPatternLength,
    addPattern,
    deletePattern,
    addArrangementBlock,
    removeArrangementBlock,
    moveArrangementBlock,
    resizeArrangementBlock,
    setArrangementLength,
    setSelectedTrackId,
    triggerPad,
    initAudio,
  };
};
