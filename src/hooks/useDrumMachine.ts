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
      steps: Array(length).fill(null).map(() => ({ active: false, velocity: 1 })),
      muted: false,
      solo: false,
      volume: 1,
      pan: sound.pan,
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
    timelinePosition: {
      timelineBar: 0,
      timelineStep: 0,
    },
    arrangementPosition: {
      currentBlockIndex: 0,
      currentBlock: null,
      currentBlockStep: 0,
      currentBlockBar: 0,
      currentBarStep: 0,
    },
    loop: {
      enabled: false,
      startBar: 0,
      endBar: 15,
    },
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
  const arrangementRef = useRef(arrangement);
  const viewModeRef = useRef(viewMode);

  // Arrangement playback tracking
  const arrangementPlaybackRef = useRef({
    currentBlockIndex: 0,
    currentBlockStep: 0,
    currentBlockBar: 0,
    currentBlock: null as string | null,
  });

  // Independent timeline position tracking (pure musical time)
  const timelinePositionRef = useRef({
    timelineBar: 0,
    timelineStep: 0,
  });

  const loopRef = useRef(transport.loop);

  const intervalRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Keep refs in sync with state
  useEffect(() => { isPlayingRef.current = transport.isPlaying; }, [transport.isPlaying]);
  useEffect(() => { bpmRef.current = transport.bpm; }, [transport.bpm]);
  useEffect(() => { stepResolutionRef.current = transport.stepResolution; }, [transport.stepResolution]);
  useEffect(() => { tripletModeRef.current = transport.tripletMode; }, [transport.tripletMode]);
  useEffect(() => { patternsRef.current = patterns; }, [patterns]);
  useEffect(() => { currentPatternIdRef.current = currentPatternId; }, [currentPatternId]);
  useEffect(() => { arrangementRef.current = arrangement; }, [arrangement]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
  useEffect(() => { loopRef.current = transport.loop; }, [transport.loop]);

  // Keep arrangement playback state in sync
  useEffect(() => {
    arrangementPlaybackRef.current = {
      currentBlockIndex: transport.arrangementPosition.currentBlockIndex,
      currentBlockStep: transport.arrangementPosition.currentBlockStep,
      currentBlockBar: transport.arrangementPosition.currentBlockBar,
      currentBlock: transport.arrangementPosition.currentBlock,
    };
  }, [transport.arrangementPosition]);

  const currentPattern = patterns.find((p) => p.id === currentPatternId) || patterns[0];

  // Linear timeline advancement with loop support
  const advanceTimelinePosition = useCallback(() => {
    const currentTimelineBar = timelinePositionRef.current.timelineBar;
    const currentTimelineStep = timelinePositionRef.current.timelineStep;
    const stepResolution = stepResolutionRef.current;

    // Get loop settings from ref to avoid stale closure issues
    const { enabled: loopEnabled, startBar, endBar } = loopRef.current;
    const totalBars = arrangementRef.current.totalBars;

    let nextStep = currentTimelineStep + 1;
    let nextBar = currentTimelineBar;

    if (nextStep >= stepResolution) {
      nextStep = 0;
      nextBar += 1;

      // Handle loop boundaries
      if (loopEnabled && nextBar > endBar) {
        nextBar = startBar;
      }

      // Handle end of arrangement (wrap or stop)
      if (nextBar >= totalBars) {
        if (loopEnabled) {
          nextBar = startBar;
        } else {
          // If no loop, wrap to beginning or stay at end? 
          // Wrapping to 0 is common for drum machines
          nextBar = 0;
        }
      }
    }

    timelinePositionRef.current = {
      timelineBar: nextBar,
      timelineStep: nextStep,
    };

    // Update transport state with independent timeline position
    // Also update the main currentStep/currentBar for display
    setTransport((prev) => ({
      ...prev,
      timelinePosition: {
        timelineBar: nextBar,
        timelineStep: nextStep,
      },
      currentBar: nextBar,
      currentStep: nextStep,
    }));
  }, []);

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

  // Find which pattern block is currently playing at a given timeline position
  const findPatternAtTimelinePosition = useCallback((timelineBar: number, timelineStepInBar: number) => {
    const arrangement = arrangementRef.current;
    const patterns = patternsRef.current;
    const stepResolution = stepResolutionRef.current;

    // Find the block that contains this timeline position
    const block = arrangement.blocks.find(b => {
      const blockEndBar = b.startBar + b.length;
      return timelineBar >= b.startBar && timelineBar < blockEndBar;
    });

    if (!block) return null;

    const pattern = patterns.find(p => p.id === block.patternId);
    if (!pattern) return null;

    // Calculate position within block correctly
    const blockStartBar = block.startBar;
    const relativeBar = timelineBar - blockStartBar;

    // Steps per bar in the arrangement timeline
    const stepsPerBar = stepResolution;

    // Calculate the absolute step position within the block
    const absoluteStepInBlock = (relativeBar * stepsPerBar) + timelineStepInBar;

    // Map the absolute block step to the pattern step (supporting looped patterns within blocks)
    const patternStep = absoluteStepInBlock % pattern.length;

    return {
      block,
      pattern,
      blockStep: patternStep,
      absoluteStepInBlock,
      relativeBar,
    };
  }, []);


  // Update arrangement playback state (highlighting in UI)
  const updateArrangementPlayback = useCallback((timelineBar: number, timelineStepInBar: number) => {
    const arrangement = arrangementRef.current;
    const patterns = patternsRef.current;
    const stepResolution = stepResolutionRef.current;

    // Find current block
    const currentBlock = arrangement.blocks.find(b => {
      const blockEndBar = b.startBar + b.length;
      return timelineBar >= b.startBar && timelineBar < blockEndBar;
    });

    const currentBlockIndex = currentBlock ?
      arrangement.blocks.findIndex(b => b.id === currentBlock.id) : 0;

    let blockStep = 0;

    if (currentBlock && currentBlock.patternId) {
      const pattern = patterns.find(p => p.id === currentBlock.patternId);
      if (pattern) {
        const blockStartBar = currentBlock.startBar;
        const relativeBar = timelineBar - blockStartBar;
        blockStep = (relativeBar * stepResolution) + timelineStepInBar;
      }
    }

    arrangementPlaybackRef.current = {
      currentBlockIndex,
      currentBlock: currentBlock?.patternId || null,
      currentBlockStep: blockStep,
      currentBlockBar: timelineBar,
    };

    setTransport((prev) => ({
      ...prev,
      arrangementPosition: {
        currentBlockIndex,
        currentBlock: currentBlock?.patternId || null,
        currentBlockStep: blockStep,
        currentBlockBar: timelineBar,
        currentBarStep: timelineStepInBar,
      },
    }));
  }, []);

  // Optimized playback step function - separates timing from processing
  const playCurrentStep = useCallback(() => {
    if (!isPlayingRef.current) return;

    const viewMode = viewModeRef.current;
    const patterns = patternsRef.current;
    const arrangement = arrangementRef.current;

    if (viewMode === 'arrangement') {
      // Use linear global timeline
      const timelineBar = timelinePositionRef.current.timelineBar;
      const timelineStep = timelinePositionRef.current.timelineStep;

      // Find which pattern block is playing at this position for audio
      const patternData = findPatternAtTimelinePosition(timelineBar, timelineStep);

      if (patternData) {
        const { pattern, blockStep } = patternData;

        // Validate step index before accessing
        if (blockStep >= 0 && blockStep < pattern.length) {
          // Play the current step of the pattern
          for (let i = 0; i < pattern.tracks.length; i++) {
            const track = pattern.tracks[i];
            if (!track.muted) {
              const stepData = track.steps[blockStep];
              if (stepData?.active) {
                playSound(track.soundId, stepData.velocity * track.volume, track.pan);
              }
            }
          }
        }
      }

      // Update UI arrangement position state
      updateArrangementPlayback(timelineBar, timelineStep);

      // Advance to next linear position
      advanceTimelinePosition();

    } else if (viewMode === 'pattern' || viewMode === 'pads') {
      // Pattern-based playback (for pads or pattern view)
      const patternId = currentPatternIdRef.current;
      const pattern = patterns.find((p) => p.id === patternId);
      if (!pattern) return;

      const step = currentStepRef.current;

      // Play the current step
      for (let i = 0; i < pattern.tracks.length; i++) {
        const track = pattern.tracks[i];
        if (!track.muted) {
          const stepData = track.steps[step];
          if (stepData?.active) {
            playSound(track.soundId, stepData.velocity * track.volume, track.pan);
          }
        }
      }

      const nextStep = (step + 1) % pattern.length;
      const nextBar = nextStep === 0 ? currentBarRef.current + 1 : currentBarRef.current;

      currentStepRef.current = nextStep;
      currentBarRef.current = nextBar;

      // Sync timelinePositionRef so switching views is smooth
      timelinePositionRef.current = {
        timelineBar: nextBar,
        timelineStep: nextStep,
      };

      setTransport((prev) => ({
        ...prev,
        currentStep: nextStep,
        currentBar: nextBar,
        timelinePosition: {
          timelineBar: nextBar,
          timelineStep: nextStep,
        },
      }));
    }
  }, [playSound, findPatternAtTimelinePosition, advanceTimelinePosition, updateArrangementPlayback]);

  // Robust timing scheduler using performance.now() with drift correction
  const startPlayback = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    // Initialize timing reference
    const intervalMs = getStepIntervalMs();
    lastTickTimeRef.current = performance.now();
    accumulatedTimeRef.current = 0;

    // CRITICAL FIX: Initialize timeline properly
    const { timelineBar, timelineStep } = timelinePositionRef.current;

    console.log('🎵 TIMING DEBUG - starting robust scheduler:', {
      intervalMs: Math.round(intervalMs * 100) / 100,
      bpm: bpmRef.current,
      stepResolution: stepResolutionRef.current,
      viewMode: viewModeRef.current,
      startPosition: { bar: timelineBar, step: timelineStep },
      timestamp: Date.now()
    });

    // If in pattern mode, ensure currentStepRef is in sync with timeline
    if (viewModeRef.current === 'pattern') {
      currentStepRef.current = timelineStep;
      currentBarRef.current = timelineBar;
    }

    // Initial step
    playCurrentStep();

    // Robust scheduler using setTimeout with drift correction
    const scheduler = () => {
      if (!isPlayingRef.current) return;

      const now = performance.now();
      const elapsed = now - lastTickTimeRef.current;
      accumulatedTimeRef.current += elapsed;

      // Check if it's time to play the next step
      if (accumulatedTimeRef.current >= intervalMs) {
        // Play the step
        playCurrentStep();

        // Reset timing reference
        accumulatedTimeRef.current -= intervalMs;
        lastTickTimeRef.current = now;

        // Log timing consistency
        if (Math.abs(accumulatedTimeRef.current) > intervalMs * 0.1) {
          console.log('⚠️ TIMING DEBUG - drift correction applied:', {
            accumulated: Math.round(accumulatedTimeRef.current * 100) / 100,
            interval: intervalMs,
            timestamp: Date.now()
          });
        }
      }

      // Schedule next check (10ms interval for precise timing)
      animationFrameRef.current = requestAnimationFrame(() => {
        setTimeout(scheduler, 10);
      });
    };

    // Start the scheduler
    scheduler();
  }, [playCurrentStep, getStepIntervalMs, updateArrangementPlayback]);

  const stopPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    // Reset timing references
    lastTickTimeRef.current = 0;
    accumulatedTimeRef.current = 0;
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

    // Reset timeline position
    timelinePositionRef.current = {
      timelineBar: 0,
      timelineStep: 0,
    };

    // Reset arrangement playback state
    arrangementPlaybackRef.current = {
      currentBlockIndex: 0,
      currentBlockStep: 0,
      currentBlockBar: 0,
      currentBlock: null,
    };

    setTransport((prev) => ({
      ...prev,
      isPlaying: false,
      currentStep: 0,
      currentBar: 0,
      timelinePosition: {
        timelineBar: 0,
        timelineStep: 0,
      },
      arrangementPosition: {
        currentBlockIndex: 0,
        currentBlockStep: 0,
        currentBlockBar: 0,
        currentBlock: null,
        currentBarStep: 0,
      },
    }));
  }, []);

  // Start from beginning (keeps playing state)
  const startFromBeginning = useCallback(() => {
    currentStepRef.current = 0;
    currentBarRef.current = 0;

    // Reset timeline position
    timelinePositionRef.current = {
      timelineBar: 0,
      timelineStep: 0,
    };

    // Reset arrangement playback state
    arrangementPlaybackRef.current = {
      currentBlockIndex: 0,
      currentBlockStep: 0,
      currentBlockBar: 0,
      currentBlock: null,
    };

    setTransport((prev) => ({
      ...prev,
      currentStep: 0,
      currentBar: 0,
      timelinePosition: {
        timelineBar: 0,
        timelineStep: 0,
      },
      arrangementPosition: {
        currentBlockIndex: 0,
        currentBlockStep: 0,
        currentBlockBar: 0,
        currentBlock: null,
        currentBarStep: 0,
      },
    }));
  }, []);

  // Jump to timeline position
  const jumpToTimelinePosition = useCallback((bar: number, step: number = 0) => {
    const clampedBar = Math.max(0, bar);
    const clampedStep = Math.max(0, step);

    timelinePositionRef.current = {
      timelineBar: clampedBar,
      timelineStep: clampedStep,
    };

    currentStepRef.current = clampedStep;
    currentBarRef.current = clampedBar;

    setTransport((prev) => ({
      ...prev,
      currentStep: clampedStep,
      currentBar: clampedBar,
      timelinePosition: {
        timelineBar: clampedBar,
        timelineStep: clampedStep,
      },
    }));
  }, []);

  // Loop control functions
  const setLoopEnabled = useCallback((enabled: boolean) => {
    setTransport((prev) => ({
      ...prev,
      loop: {
        ...prev.loop,
        enabled,
      },
    }));
  }, []);

  const setLoopPoints = useCallback((startBar: number, endBar: number) => {
    setTransport((prev) => ({
      ...prev,
      loop: {
        ...prev.loop,
        startBar: Math.max(0, startBar),
        endBar: Math.max(startBar, endBar),
      },
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

  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    setPatterns((prev) =>
      prev.map((pattern) => {
        if (pattern.id !== currentPatternId) return pattern;
        return {
          ...pattern,
          tracks: pattern.tracks.map((track) => {
            if (track.id !== trackId) return track;
            return { ...track, volume: Math.max(0, Math.min(2, volume)) };
          }),
        };
      })
    );
  }, [currentPatternId]);

  const setTrackPan = useCallback((trackId: string, pan: number) => {
    setPatterns((prev) =>
      prev.map((pattern) => {
        if (pattern.id !== currentPatternId) return pattern;
        return {
          ...pattern,
          tracks: pattern.tracks.map((track) => {
            if (track.id !== trackId) return track;
            return { ...track, pan: Math.max(-1, Math.min(1, pan)) };
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
    const pattern = patternsRef.current.find(p => p.id === patternId);
    if (!pattern) return;

    // Determine how many bars this pattern spans based on current step resolution
    // Pattern length is in steps, resolution is steps per bar
    const stepResolution = stepResolutionRef.current;
    const barLength = Math.max(1, Math.ceil(pattern.length / stepResolution));

    const newBlock: ArrangementBlock = {
      id: `block-${Date.now()}`,
      patternId,
      startBar,
      length: barLength,
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

  const triggerPad = useCallback(async (soundId: string, pan?: number) => {
    if (!isInitialized) {
      await initAudio(currentKit);
    }
    playSound(soundId, 1, pan);
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
    const filename = `drum-machine-pattern-${new Date().toISOString().slice(0, 10)}`;
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
    startFromBeginning,
    jumpToTimelinePosition,
    setBpm,
    setStepResolution,
    setTripletMode,
    setTimeSignature,
    toggleStep,
    setStepVelocity,
    toggleTrackMute,
    toggleTrackSolo,
    setTrackVolume,
    setTrackPan,
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
    setLoopEnabled,
    setLoopPoints,
  };
};
