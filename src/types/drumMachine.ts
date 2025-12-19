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
  pan: number;
}

export interface Pattern {
  id: string;
  name: string;
  tracks: Track[];
  length: number;
  swing: number;
}

export interface ArrangementBlock {
  id: string;
  patternId: string;
  startBar: number;
  length: number;
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

export type ViewMode = 'pads' | 'pattern' | 'arrangement' | 'mixer';

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

// Sound kit types
export type SoundKitId = 'classic' | '808' | 'acoustic' | 'electronic' | 'lofi';

export interface SoundDefinition {
  id: string;
  name: string;
  color: string;
  volume: number;
  pan: number;
}

export interface SoundKit {
  id: SoundKitId;
  name: string;
  sounds: SoundDefinition[];
}

// Classic kit (original)
const CLASSIC_SOUNDS: SoundDefinition[] = [
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

// 808 kit
const KIT_808_SOUNDS: SoundDefinition[] = [
  { id: '808-kick', name: '808 Kick', color: 'bg-pattern-1', volume: 1, pan: 0 },
  { id: '808-snare', name: '808 Snare', color: 'bg-pattern-2', volume: 0.9, pan: 0 },
  { id: '808-hat-c', name: '808 Hat C', color: 'bg-pattern-3', volume: 0.7, pan: 0 },
  { id: '808-hat-o', name: '808 Hat O', color: 'bg-pattern-3', volume: 0.65, pan: 0 },
  { id: '808-clap', name: '808 Clap', color: 'bg-pattern-4', volume: 0.85, pan: 0 },
  { id: '808-tom-h', name: '808 Tom H', color: 'bg-pattern-5', volume: 0.8, pan: 0.3 },
  { id: '808-tom-m', name: '808 Tom M', color: 'bg-pattern-5', volume: 0.8, pan: 0 },
  { id: '808-tom-l', name: '808 Tom L', color: 'bg-pattern-5', volume: 0.8, pan: -0.3 },
  { id: '808-cym', name: '808 Cymbal', color: 'bg-pattern-6', volume: 0.6, pan: -0.3 },
  { id: '808-ride', name: '808 Ride', color: 'bg-pattern-6', volume: 0.55, pan: 0.3 },
  { id: '808-conga-h', name: 'Conga Hi', color: 'bg-pattern-7', volume: 0.7, pan: -0.2 },
  { id: '808-conga-l', name: 'Conga Lo', color: 'bg-pattern-7', volume: 0.7, pan: 0.2 },
  { id: '808-rim', name: '808 Rim', color: 'bg-pattern-8', volume: 0.75, pan: 0 },
  { id: '808-cow', name: '808 Cow', color: 'bg-pattern-8', volume: 0.65, pan: 0.1 },
  { id: '808-marac', name: 'Maracas', color: 'bg-pattern-3', volume: 0.45, pan: 0.3 },
  { id: '808-clav', name: 'Claves', color: 'bg-pattern-3', volume: 0.5, pan: -0.3 },
];

// Acoustic kit
const ACOUSTIC_SOUNDS: SoundDefinition[] = [
  { id: 'ac-kick', name: 'Kick', color: 'bg-pattern-1', volume: 1, pan: 0 },
  { id: 'ac-snare', name: 'Snare', color: 'bg-pattern-2', volume: 0.95, pan: 0 },
  { id: 'ac-hat-c', name: 'Hat Cls', color: 'bg-pattern-3', volume: 0.7, pan: 0.1 },
  { id: 'ac-hat-o', name: 'Hat Opn', color: 'bg-pattern-3', volume: 0.65, pan: 0.1 },
  { id: 'ac-stick', name: 'Sticks', color: 'bg-pattern-4', volume: 0.8, pan: 0 },
  { id: 'ac-tom-h', name: 'Tom 12"', color: 'bg-pattern-5', volume: 0.85, pan: 0.2 },
  { id: 'ac-tom-m', name: 'Tom 14"', color: 'bg-pattern-5', volume: 0.85, pan: 0 },
  { id: 'ac-tom-f', name: 'Floor Tom', color: 'bg-pattern-5', volume: 0.85, pan: -0.2 },
  { id: 'ac-crash', name: 'Crash', color: 'bg-pattern-6', volume: 0.65, pan: -0.4 },
  { id: 'ac-ride', name: 'Ride', color: 'bg-pattern-6', volume: 0.6, pan: 0.4 },
  { id: 'ac-bell', name: 'Ride Bell', color: 'bg-pattern-7', volume: 0.7, pan: 0.4 },
  { id: 'ac-splash', name: 'Splash', color: 'bg-pattern-7', volume: 0.55, pan: 0.2 },
  { id: 'ac-rim', name: 'Rimshot', color: 'bg-pattern-8', volume: 0.8, pan: 0 },
  { id: 'ac-cross', name: 'X-Stick', color: 'bg-pattern-8', volume: 0.75, pan: 0 },
  { id: 'ac-brush', name: 'Brush', color: 'bg-pattern-3', volume: 0.5, pan: 0.1 },
  { id: 'ac-flam', name: 'Flam', color: 'bg-pattern-2', volume: 0.9, pan: 0 },
];

// Electronic kit
const ELECTRONIC_SOUNDS: SoundDefinition[] = [
  { id: 'el-kick', name: 'E-Kick', color: 'bg-pattern-1', volume: 1, pan: 0 },
  { id: 'el-snare', name: 'E-Snare', color: 'bg-pattern-2', volume: 0.9, pan: 0 },
  { id: 'el-hat-c', name: 'E-Hat C', color: 'bg-pattern-3', volume: 0.75, pan: 0 },
  { id: 'el-hat-o', name: 'E-Hat O', color: 'bg-pattern-3', volume: 0.7, pan: 0 },
  { id: 'el-clap', name: 'E-Clap', color: 'bg-pattern-4', volume: 0.85, pan: 0 },
  { id: 'el-perc1', name: 'Blip', color: 'bg-pattern-5', volume: 0.7, pan: 0.2 },
  { id: 'el-perc2', name: 'Zap', color: 'bg-pattern-5', volume: 0.7, pan: -0.2 },
  { id: 'el-bass', name: 'Sub Hit', color: 'bg-pattern-1', volume: 0.9, pan: 0 },
  { id: 'el-noise', name: 'Noise', color: 'bg-pattern-6', volume: 0.5, pan: 0 },
  { id: 'el-metal', name: 'Metal', color: 'bg-pattern-6', volume: 0.6, pan: 0.3 },
  { id: 'el-laser', name: 'Laser', color: 'bg-pattern-7', volume: 0.65, pan: -0.2 },
  { id: 'el-buzz', name: 'Buzz', color: 'bg-pattern-7', volume: 0.6, pan: 0.2 },
  { id: 'el-click', name: 'Click', color: 'bg-pattern-8', volume: 0.75, pan: 0 },
  { id: 'el-beep', name: 'Beep', color: 'bg-pattern-8', volume: 0.65, pan: 0.1 },
  { id: 'el-glitch', name: 'Glitch', color: 'bg-pattern-3', volume: 0.55, pan: -0.3 },
  { id: 'el-sweep', name: 'Sweep', color: 'bg-pattern-4', volume: 0.5, pan: 0 },
];

// Lo-fi kit
const LOFI_SOUNDS: SoundDefinition[] = [
  { id: 'lo-kick', name: 'Dusty Kick', color: 'bg-pattern-1', volume: 0.95, pan: 0 },
  { id: 'lo-snare', name: 'Vinyl Snr', color: 'bg-pattern-2', volume: 0.85, pan: 0 },
  { id: 'lo-hat-c', name: 'Soft Hat', color: 'bg-pattern-3', volume: 0.6, pan: 0.1 },
  { id: 'lo-hat-o', name: 'Airy Hat', color: 'bg-pattern-3', volume: 0.55, pan: 0.1 },
  { id: 'lo-snap', name: 'Snap', color: 'bg-pattern-4', volume: 0.7, pan: 0 },
  { id: 'lo-perc1', name: 'Wood', color: 'bg-pattern-5', volume: 0.65, pan: 0.2 },
  { id: 'lo-perc2', name: 'Tap', color: 'bg-pattern-5', volume: 0.6, pan: -0.2 },
  { id: 'lo-bass', name: 'Muted', color: 'bg-pattern-1', volume: 0.8, pan: 0 },
  { id: 'lo-crackle', name: 'Crackle', color: 'bg-pattern-6', volume: 0.35, pan: 0 },
  { id: 'lo-hiss', name: 'Hiss', color: 'bg-pattern-6', volume: 0.3, pan: 0 },
  { id: 'lo-chime', name: 'Chime', color: 'bg-pattern-7', volume: 0.5, pan: -0.3 },
  { id: 'lo-bell', name: 'Bell', color: 'bg-pattern-7', volume: 0.55, pan: 0.3 },
  { id: 'lo-rim', name: 'Rim', color: 'bg-pattern-8', volume: 0.65, pan: 0 },
  { id: 'lo-click', name: 'Click', color: 'bg-pattern-8', volume: 0.6, pan: 0.1 },
  { id: 'lo-shake', name: 'Shake', color: 'bg-pattern-3', volume: 0.4, pan: 0.2 },
  { id: 'lo-brush', name: 'Brush', color: 'bg-pattern-3', volume: 0.45, pan: -0.2 },
];

export const SOUND_KITS: SoundKit[] = [
  { id: 'classic', name: 'Classic', sounds: CLASSIC_SOUNDS },
  { id: '808', name: 'TR-808', sounds: KIT_808_SOUNDS },
  { id: 'acoustic', name: 'Acoustic', sounds: ACOUSTIC_SOUNDS },
  { id: 'electronic', name: 'Electronic', sounds: ELECTRONIC_SOUNDS },
  { id: 'lofi', name: 'Lo-Fi', sounds: LOFI_SOUNDS },
];

export const DEFAULT_SOUNDS = CLASSIC_SOUNDS;

// Pattern file format for save/load
export interface PatternFile {
  version: string;
  exportedAt: string;
  kit: SoundKitId;
  bpm: number;
  timeSignature: TimeSignature;
  stepResolution: StepResolution;
  patterns: {
    id: string;
    name: string;
    length: number;
    swing: number;
    tracks: {
      soundId: string;
      steps: Step[];
      muted: boolean;
      solo: boolean;
      volume: number;
      pan: number;
    }[];
  }[];
  arrangement: {
    name: string;
    totalBars: number;
    blocks: ArrangementBlock[];
  };
}
