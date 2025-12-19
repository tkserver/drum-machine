import { Pattern, Arrangement, TransportState, PatternFile, SoundKitId, TimeSignature, StepResolution } from '@/types/drumMachine';

const CURRENT_VERSION = '1.0.0';

export const exportPatternFile = (
  patterns: Pattern[],
  arrangement: Arrangement,
  transport: TransportState,
  kit: SoundKitId
): string => {
  const fileData: PatternFile = {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    kit,
    bpm: transport.bpm,
    timeSignature: transport.timeSignature,
    stepResolution: transport.stepResolution,
    patterns: patterns.map(p => ({
      id: p.id,
      name: p.name,
      length: p.length,
      swing: p.swing,
      tracks: p.tracks.map(t => ({
        soundId: t.soundId,
        steps: t.steps,
        muted: t.muted,
        solo: t.solo,
        volume: t.volume,
      })),
    })),
    arrangement: {
      name: arrangement.name,
      totalBars: arrangement.totalBars,
      blocks: arrangement.blocks,
    },
  };
  
  return JSON.stringify(fileData, null, 2);
};

export const downloadPatternFile = (
  patterns: Pattern[],
  arrangement: Arrangement,
  transport: TransportState,
  kit: SoundKitId,
  filename: string = 'drum-machine-pattern'
) => {
  const json = exportPatternFile(patterns, arrangement, transport, kit);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export interface LoadedPatternData {
  patterns: Pattern[];
  arrangement: Arrangement;
  bpm: number;
  timeSignature: TimeSignature;
  stepResolution: StepResolution;
  kit: SoundKitId;
}

export const parsePatternFile = (jsonString: string): LoadedPatternData | null => {
  try {
    const data = JSON.parse(jsonString) as PatternFile;
    
    // Validate version
    if (!data.version) {
      console.error('Invalid pattern file: missing version');
      return null;
    }
    
    // Reconstruct patterns with full track IDs
    const patterns: Pattern[] = data.patterns.map(p => ({
      id: p.id,
      name: p.name,
      length: p.length,
      swing: p.swing,
      tracks: p.tracks.map((t, index) => ({
        id: `${p.id}-${t.soundId}`,
        soundId: t.soundId,
        steps: t.steps,
        muted: t.muted,
        solo: t.solo,
        volume: t.volume,
      })),
    }));
    
    const arrangement: Arrangement = {
      id: 'arr-1',
      name: data.arrangement.name,
      totalBars: data.arrangement.totalBars,
      blocks: data.arrangement.blocks,
    };
    
    return {
      patterns,
      arrangement,
      bpm: data.bpm,
      timeSignature: data.timeSignature,
      stepResolution: data.stepResolution,
      kit: data.kit,
    };
  } catch (error) {
    console.error('Failed to parse pattern file:', error);
    return null;
  }
};

export const loadPatternFromFile = (): Promise<LoadedPatternData | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      
      try {
        const text = await file.text();
        const data = parsePatternFile(text);
        resolve(data);
      } catch (error) {
        console.error('Failed to read file:', error);
        resolve(null);
      }
    };
    
    input.click();
  });
};
