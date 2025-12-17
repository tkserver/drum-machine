import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Pattern, 
  Arrangement, 
  ArrangementBlock,
  TransportState, 
  ViewMode,
  SoundKitId,
  SOUND_KITS,
} from '@/types/drumMachine';
import { useAudioEngine } from './useAudioEngine';
import { downloadPatternFile, loadPatternFromFile, LoadedPatternData } from '@/utils/patternStorage';
import { toast } from 'sonner';

const createEmptyPattern = (id: string, name: string, length: number = 16, kitId: SoundKitId = 'classic'): Pattern => {
  const kit = SOUND_KITS.find(k => k.id === kitId) || SOUND_KITS[0];
  return {
    id,
    name,
    length,
    swing: 0,
    tracks: kit.sounds.map((sound) => ({
      id: `${id}-${sound.id}`,
      soundId: sound.id,
      steps: Array(64).fill(null).map(() => ({ active: false, velocity: 1 })),
      muted: false,
      solo: false,
      volume: 1,
    })),
  };
};

const createEmptyArrangement = (): Arrangement => ({
  id: 'arr-1',
  name: 'Arrangement 1',
  blocks: [],
  totalBars: 16,
});

export const useDrumMachine = () => {
  const { isInitialized, sounds, currentKit, initAudio, switchKit, playSound } = useAudioEngine();
  
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
  
  // Refs for timing
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
    
    const msPerBeat = 60000 / bpm;
    const stepsPerBeat = resolution / 4;
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
    
    pattern.tracks.forEach((track) => {
      if (track.muted) return;
      const stepData = track.steps[step];
      if (stepData?.active) {
        playSound(track.soundId, stepData.velocity * track.volume);
      }
    });

    const nextStep = (step + 1) % pattern.length;
    const nextBar = nextStep === 0 ? currentBarRef.current + 1 : currentBarRef.current;
    
    currentStepRef.current = nextStep;
    currentBarRef.current = nextBar;
    
    setTransport((prev) => ({
      ...prev,
      currentStep: nextStep,
      currentBar: nextBar,
    }));
  }, [playSound]);

  const startPlayback = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    playCurrentStep();
    const intervalMs = getStepIntervalMs();
    intervalRef.current = window.setInterval(playCurrentStep, intervalMs);
  }, [playCurrentStep, getStepIntervalMs]);

  const stopPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (transport.isPlaying) {
      startPlayback();
    } else {
      stopPlayback();
    }
    return () => stopPlayback();
  }, [transport.isPlaying, startPlayback, stopPlayback]);

  useEffect(() => {
    if (transport.isPlaying && intervalRef.current) {
      stopPlayback();
      startPlayback();
    }
  }, [transport.bpm, transport.stepResolution, transport.tripletMode]);

  const togglePlay = useCallback(async () => {
    if (!isInitialized) {
      await initAudio(currentKit);
    }
    setTransport((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [isInitialized, initAudio, currentKit]);

  const stop = useCallback(() => {
    currentStepRef.current = 0;
    currentBarRef.current = 0;
    setTransport((prev) => ({ ...prev, isPlaying: false, currentStep: 0, currentBar: 0 }));
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
            newSteps[stepIndex] = { ...newSteps[stepIndex], active: !newSteps[stepIndex].active };
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
    const newPattern = createEmptyPattern(newId, `Pattern ${patterns.length + 1}`, 16, currentKit);
    setPatterns((prev) => [...prev, newPattern]);
    return newPattern;
  }, [patterns.length, currentKit]);

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
    setArrangement((prev) => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
  }, []);

  const removeArrangementBlock = useCallback((blockId: string) => {
    setArrangement((prev) => ({ ...prev, blocks: prev.blocks.filter((b) => b.id !== blockId) }));
  }, []);

  const moveArrangementBlock = useCallback((blockId: string, newStartBar: number) => {
    setArrangement((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => b.id === blockId ? { ...b, startBar: Math.max(0, newStartBar) } : b),
    }));
  }, []);

  const resizeArrangementBlock = useCallback((blockId: string, newLength: number) => {
    setArrangement((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => b.id === blockId ? { ...b, length: Math.max(1, newLength) } : b),
    }));
  }, []);

  const setArrangementLength = useCallback((totalBars: number) => {
    setArrangement((prev) => ({ ...prev, totalBars: Math.max(4, totalBars) }));
  }, []);

  const triggerPad = useCallback(async (soundId: string) => {
    if (!isInitialized) {
      await initAudio(currentKit);
    }
    playSound(soundId);
  }, [isInitialized, initAudio, playSound, currentKit]);

  // Kit switching
  const changeKit = useCallback(async (kitId: SoundKitId) => {
    await switchKit(kitId);
    
    // Update patterns to use new kit's sound IDs
    const kit = SOUND_KITS.find(k => k.id === kitId) || SOUND_KITS[0];
    setPatterns((prev) =>
      prev.map((pattern) => ({
        ...pattern,
        tracks: pattern.tracks.map((track, index) => ({
          ...track,
          id: `${pattern.id}-${kit.sounds[index].id}`,
          soundId: kit.sounds[index].id,
        })),
      }))
    );
    
    toast.success(`Switched to ${kit.name} kit`);
  }, [switchKit]);

  // Save/Load functions
  const savePattern = useCallback(() => {
    const filename = `beatforge-${new Date().toISOString().slice(0, 10)}`;
    downloadPatternFile(patterns, arrangement, transport, currentKit, filename);
    toast.success('Pattern saved!');
  }, [patterns, arrangement, transport, currentKit]);

  const loadPattern = useCallback(async () => {
    const data = await loadPatternFromFile();
    if (!data) {
      toast.error('Failed to load pattern file');
      return;
    }
    
    // Switch to the saved kit
    await switchKit(data.kit);
    
    // Load all the data
    setPatterns(data.patterns);
    setArrangement(data.arrangement);
    setBpm(data.bpm);
    setTransport((prev) => ({
      ...prev,
      bpm: data.bpm,
      timeSignature: data.timeSignature,
      stepResolution: data.stepResolution,
    }));
    
    if (data.patterns.length > 0) {
      setCurrentPatternId(data.patterns[0].id);
    }
    
    toast.success('Pattern loaded!');
  }, [switchKit, setBpm]);

  const clearAllPatterns = useCallback(() => {
    setPatterns([
      createEmptyPattern('pattern-1', 'Pattern 1', 16, currentKit),
      createEmptyPattern('pattern-2', 'Pattern 2', 16, currentKit),
      createEmptyPattern('pattern-3', 'Pattern 3', 16, currentKit),
      createEmptyPattern('pattern-4', 'Pattern 4', 16, currentKit),
    ]);
    setArrangement(createEmptyArrangement());
    setCurrentPatternId('pattern-1');
    toast.success('All patterns cleared');
  }, [currentKit]);

  return {
    viewMode,
    patterns,
    currentPattern,
    currentPatternId,
    arrangement,
    transport,
    sounds,
    selectedTrackId,
    isInitialized,
    currentKit,
    
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
    changeKit,
    savePattern,
    loadPattern,
    clearAllPatterns,
  };
};
