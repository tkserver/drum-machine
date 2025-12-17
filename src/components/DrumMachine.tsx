import { useEffect, useCallback } from 'react';
import { useDrumMachine } from '@/hooks/useDrumMachine';
import { Navigation } from './Navigation';
import { TransportControls } from './TransportControls';
import { PadsView } from './PadsView';
import { PatternView } from './PatternView';
import { ArrangementView } from './ArrangementView';
import { PatternSelector } from './PatternSelector';
import { toast } from 'sonner';

export const DrumMachine = () => {
  const {
    viewMode,
    setViewMode,
    patterns,
    currentPattern,
    currentPatternId,
    setCurrentPatternId,
    arrangement,
    transport,
    sounds,
    currentKit,
    togglePlay,
    stop,
    setBpm,
    setStepResolution,
    setTripletMode,
    setTimeSignature,
    toggleStep,
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
    triggerPad,
    initAudio,
    changeKit,
    savePattern,
    loadPattern,
    clearAllPatterns,
  } = useDrumMachine();

  // Keyboard shortcuts
  useEffect(() => {
    const keyMap: Record<string, number> = {
      q: 0, w: 1, e: 2, r: 3,
      a: 4, s: 5, d: 6, f: 7,
      z: 8, x: 9, c: 10, v: 11,
      '1': 12, '2': 13, '3': 14, '4': 15,
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      const key = e.key.toLowerCase();
      
      if (key in keyMap && sounds[keyMap[key]]) {
        triggerPad(sounds[keyMap[key]].id);
        return;
      }

      if (key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (key === 'escape') {
        stop();
      } else if (e.ctrlKey && key === 's') {
        e.preventDefault();
        savePattern();
      } else if (e.ctrlKey && key === 'o') {
        e.preventDefault();
        loadPattern();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sounds, triggerPad, togglePlay, stop, savePattern, loadPattern]);

  const handleExport = useCallback(async () => {
    toast.info('Export coming soon!', {
      description: 'Audio export will render your arrangement to WAV.',
    });
  }, []);

  const handleTriggerFromPattern = useCallback((soundId: string) => {
    triggerPad(soundId);
  }, [triggerPad]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden crt-flicker">
      <Navigation 
        viewMode={viewMode} 
        onSetViewMode={setViewMode}
        currentKit={currentKit}
        onChangeKit={changeKit}
        onSave={savePattern}
        onLoad={loadPattern}
        onClear={clearAllPatterns}
      />
      
      {(viewMode === 'pattern' || viewMode === 'arrangement') && (
        <PatternSelector
          patterns={patterns}
          currentPatternId={currentPatternId}
          onSelectPattern={setCurrentPatternId}
          onAddPattern={addPattern}
          onDeletePattern={deletePattern}
          onSetLength={setPatternLength}
        />
      )}

      <main className="flex-1 flex overflow-hidden">
        {viewMode === 'pads' && (
          <PadsView
            sounds={sounds}
            onTrigger={triggerPad}
          />
        )}
        
        {viewMode === 'pattern' && (
          <PatternView
            pattern={currentPattern}
            sounds={sounds}
            transport={transport}
            onToggleStep={toggleStep}
            onToggleMute={toggleTrackMute}
            onToggleSolo={toggleTrackSolo}
            onTriggerSound={handleTriggerFromPattern}
          />
        )}
        
        {viewMode === 'arrangement' && (
          <ArrangementView
            arrangement={arrangement}
            patterns={patterns}
            currentPatternId={currentPatternId}
            onAddBlock={addArrangementBlock}
            onRemoveBlock={removeArrangementBlock}
            onMoveBlock={moveArrangementBlock}
            onResizeBlock={resizeArrangementBlock}
            onSetLength={setArrangementLength}
            onSelectPattern={setCurrentPatternId}
          />
        )}
      </main>

      <TransportControls
        transport={transport}
        onTogglePlay={togglePlay}
        onStop={stop}
        onSetBpm={setBpm}
        onSetResolution={setStepResolution}
        onSetTripletMode={setTripletMode}
        onSetTimeSignature={setTimeSignature}
        onExport={handleExport}
      />
    </div>
  );
};
