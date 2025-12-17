import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Pattern, 
  Track, 
  Step, 
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
  
  const schedulerRef = useRef<number | null>(null);
  const nextStepTimeRef = useRef<number>(0);
  const lastStepRef = useRef<number>(-1);

  const currentPattern = patterns.find((p) => p.id === currentPatternId) || patterns[0];

  const getStepDuration = useCallback(() => {
    const { bpm, stepResolution, tripletMode } = transport;
    const beatDuration = 60 / bpm;
    const stepsPerBeat = stepResolution / 4;
    let stepDuration = beatDuration / stepsPerBeat;
    
    if (tripletMode === 'triplet') {
      stepDuration = (beatDuration / stepsPerBeat) * (2 / 3);
    }
    
    return stepDuration;
  }, [transport]);

  const scheduleStep = useCallback(() => {
    if (!isInitialized) return;

    const currentTime = performance.now() / 1000;
    const stepDuration = getStepDuration();
    const lookAhead = 0.1; // 100ms look-ahead

    while (nextStepTimeRef.current < currentTime + lookAhead) {
      const stepToPlay = transport.currentStep;
      
      if (stepToPlay !== lastStepRef.current) {
        // Play sounds for this step
        currentPattern.tracks.forEach((track) => {
          if (track.muted) return;
          
          const step = track.steps[stepToPlay];
          if (step?.active) {
            playSound(track.soundId, step.velocity * track.volume);
          }
        });
        
        lastStepRef.current = stepToPlay;
      }

      // Advance to next step
      setTransport((prev) => {
        const nextStep = (prev.currentStep + 1) % currentPattern.length;
        const nextBar = nextStep === 0 ? prev.currentBar + 1 : prev.currentBar;
        return {
          ...prev,
          currentStep: nextStep,
          currentBar: nextBar,
        };
      });

      nextStepTimeRef.current += stepDuration;
    }
  }, [isInitialized, transport.currentStep, currentPattern, playSound, getStepDuration]);

  useEffect(() => {
    if (transport.isPlaying) {
      const scheduler = () => {
        scheduleStep();
        schedulerRef.current = requestAnimationFrame(scheduler);
      };
      
      nextStepTimeRef.current = performance.now() / 1000;
      lastStepRef.current = -1;
      schedulerRef.current = requestAnimationFrame(scheduler);
    } else {
      if (schedulerRef.current) {
        cancelAnimationFrame(schedulerRef.current);
        schedulerRef.current = null;
      }
    }

    return () => {
      if (schedulerRef.current) {
        cancelAnimationFrame(schedulerRef.current);
      }
    };
  }, [transport.isPlaying, scheduleStep]);

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
    setTransport((prev) => ({
      ...prev,
      isPlaying: false,
      currentStep: 0,
      currentBar: 0,
    }));
  }, []);

  const setBpm = useCallback((bpm: number) => {
    setTransport((prev) => ({ ...prev, bpm: Math.max(20, Math.min(300, bpm)) }));
  }, []);

  const setStepResolution = useCallback((resolution: 4 | 8 | 16 | 32) => {
    setTransport((prev) => ({ ...prev, stepResolution: resolution }));
  }, []);

  const setTripletMode = useCallback((mode: 'straight' | 'triplet') => {
    setTransport((prev) => ({ ...prev, tripletMode: mode }));
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

  const addArrangementBlock = useCallback((patternId: string, startBar: number) => {
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
    setSelectedTrackId,
    triggerPad,
    initAudio,
  };
};
