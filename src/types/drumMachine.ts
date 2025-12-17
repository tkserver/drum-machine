export interface Sound {
  id: string;
  name: string;
  buffer: AudioBuffer | null;
  color: string;
  volume: number;
  pan: number;
}

export interface Step {
  active: boolean;
  velocity: number;
}

export interface Track {
  id: string;
  soundId: string;
  steps: Step[];
  muted: boolean;
  solo: boolean;
  volume: number;
}

export interface Pattern {
  id: string;
  name: string;
  tracks: Track[];
  length: number; // number of steps
  swing: number;
}

export interface ArrangementBlock {
  id: string;
  patternId: string;
  startBar: number;
  length: number; // in bars
}

export interface Arrangement {
  id: string;
  name: string;
  blocks: ArrangementBlock[];
  totalBars: number;
}

export type TimeSignature = '4/4' | '3/4' | '6/8';
export type StepResolution = 4 | 8 | 16 | 32;
export type TripletMode = 'straight' | 'triplet';

export interface TransportState {
  isPlaying: boolean;
  bpm: number;
  currentStep: number;
  currentBar: number;
  timeSignature: TimeSignature;
  stepResolution: StepResolution;
  tripletMode: TripletMode;
}

export type ViewMode = 'pads' | 'pattern' | 'arrangement';

export const PATTERN_COLORS = [
  'bg-pattern-1',
  'bg-pattern-2',
  'bg-pattern-3',
  'bg-pattern-4',
  'bg-pattern-5',
  'bg-pattern-6',
  'bg-pattern-7',
  'bg-pattern-8',
] as const;

export const DEFAULT_SOUNDS: Omit<Sound, 'buffer'>[] = [
  { id: 'kick', name: 'Kick', color: 'bg-pattern-1', volume: 1, pan: 0 },
  { id: 'snare', name: 'Snare', color: 'bg-pattern-2', volume: 1, pan: 0 },
  { id: 'hihat-closed', name: 'HH Closed', color: 'bg-pattern-3', volume: 0.8, pan: 0 },
  { id: 'hihat-open', name: 'HH Open', color: 'bg-pattern-3', volume: 0.7, pan: 0 },
  { id: 'clap', name: 'Clap', color: 'bg-pattern-4', volume: 0.9, pan: 0 },
  { id: 'tom-hi', name: 'Tom Hi', color: 'bg-pattern-5', volume: 0.85, pan: 0.3 },
  { id: 'tom-mid', name: 'Tom Mid', color: 'bg-pattern-5', volume: 0.85, pan: 0 },
  { id: 'tom-low', name: 'Tom Low', color: 'bg-pattern-5', volume: 0.85, pan: -0.3 },
  { id: 'crash', name: 'Crash', color: 'bg-pattern-6', volume: 0.7, pan: -0.4 },
  { id: 'ride', name: 'Ride', color: 'bg-pattern-6', volume: 0.6, pan: 0.4 },
  { id: 'perc-1', name: 'Perc 1', color: 'bg-pattern-7', volume: 0.75, pan: -0.2 },
  { id: 'perc-2', name: 'Perc 2', color: 'bg-pattern-7', volume: 0.75, pan: 0.2 },
  { id: 'rim', name: 'Rim', color: 'bg-pattern-8', volume: 0.8, pan: 0 },
  { id: 'cowbell', name: 'Cowbell', color: 'bg-pattern-8', volume: 0.7, pan: 0.1 },
  { id: 'shaker', name: 'Shaker', color: 'bg-pattern-3', volume: 0.5, pan: 0.3 },
  { id: 'tambourine', name: 'Tamb', color: 'bg-pattern-3', volume: 0.55, pan: -0.3 },
];
