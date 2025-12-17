import { TransportState, TimeSignature } from '@/types/drumMachine';
import { cn } from '@/lib/utils';
import { Play, Pause, Square, Download } from 'lucide-react';

interface TransportControlsProps {
  transport: TransportState;
  onTogglePlay: () => void;
  onStop: () => void;
  onSetBpm: (bpm: number) => void;
  onSetResolution: (resolution: 4 | 8 | 16 | 32) => void;
  onSetTripletMode: (mode: 'straight' | 'triplet') => void;
  onSetTimeSignature?: (sig: TimeSignature) => void;
  onExport?: () => void;
}

export const TransportControls = ({
  transport,
  onTogglePlay,
  onStop,
  onSetBpm,
  onSetResolution,
  onSetTripletMode,
  onSetTimeSignature,
  onExport,
}: TransportControlsProps) => {
  // Preset tempos
  const tempoPresets = [
    { label: 'SLOW', bpm: 80 },
    { label: 'MID', bpm: 120 },
    { label: 'FAST', bpm: 140 },
    { label: 'RAVE', bpm: 170 },
  ];

  const handleBpmChange = (delta: number) => {
    onSetBpm(Math.max(20, Math.min(300, transport.bpm + delta)));
  };

  return (
    <div className="transport-gradient px-4 py-4">
      <div className="flex items-center justify-between gap-6 max-w-7xl mx-auto">
        {/* Play controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className={cn('transport-button', transport.isPlaying && 'playing')}
          >
            {transport.isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </button>
          <button onClick={onStop} className="transport-button">
            <Square className="w-5 h-5" />
          </button>
        </div>

        {/* BPM Section */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <span className="font-pixel text-xs text-muted-foreground mb-1">BPM</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleBpmChange(-10)}
                className="px-2 py-1 bg-muted border-2 border-border hover:border-primary/50 font-pixel-body text-xl"
              >
                -
              </button>
              <input
                type="number"
                value={transport.bpm}
                onChange={(e) => onSetBpm(parseInt(e.target.value) || 120)}
                className="pixel-input w-24 text-center text-2xl"
                min={20}
                max={300}
              />
              <button
                onClick={() => handleBpmChange(10)}
                className="px-2 py-1 bg-muted border-2 border-border hover:border-primary/50 font-pixel-body text-xl"
              >
                +
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              {tempoPresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => onSetBpm(preset.bpm)}
                  className={cn(
                    'px-3 py-2 font-pixel text-xs border-2 transition-all',
                    transport.bpm === preset.bpm
                      ? 'bg-primary text-primary-foreground border-primary glow-green'
                      : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Time Signature */}
        <div className="flex flex-col items-center">
          <span className="font-pixel text-xs text-muted-foreground mb-1">TIME</span>
          <div className="flex gap-1">
            {(['4/4', '3/4', '6/8'] as TimeSignature[]).map((sig) => (
              <button
                key={sig}
                onClick={() => onSetTimeSignature?.(sig)}
                className={cn(
                  'px-3 py-2 font-pixel-body text-xl border-2 transition-all',
                  transport.timeSignature === sig
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                )}
              >
                {sig}
              </button>
            ))}
          </div>
        </div>

        {/* Resolution */}
        <div className="flex flex-col items-center">
          <span className="font-pixel text-xs text-muted-foreground mb-1">GRID</span>
          <div className="flex gap-1">
            {([4, 8, 16, 32] as const).map((res) => (
              <button
                key={res}
                onClick={() => onSetResolution(res)}
                className={cn(
                  'px-3 py-2 font-pixel-body text-xl border-2 transition-all min-w-[48px]',
                  transport.stepResolution === res
                    ? 'bg-secondary text-secondary-foreground border-secondary glow-accent'
                    : 'bg-muted text-muted-foreground border-border hover:border-secondary/50'
                )}
              >
                1/{res}
              </button>
            ))}
          </div>
        </div>

        {/* Triplet */}
        <div className="flex flex-col items-center">
          <span className="font-pixel text-xs text-muted-foreground mb-1">MODE</span>
          <div className="flex border-4 border-border overflow-hidden">
            <button
              onClick={() => onSetTripletMode('straight')}
              className={cn(
                'px-4 py-2 font-pixel text-xs transition-all',
                transport.tripletMode === 'straight'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-card'
              )}
            >
              STR
            </button>
            <button
              onClick={() => onSetTripletMode('triplet')}
              className={cn(
                'px-4 py-2 font-pixel text-xs transition-all',
                transport.tripletMode === 'triplet'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-card'
              )}
            >
              TRP
            </button>
          </div>
        </div>

        {/* Position display */}
        <div className="flex flex-col items-center">
          <span className="font-pixel text-xs text-muted-foreground mb-1">POS</span>
          <div className="font-pixel-body text-3xl tabular-nums bg-muted px-4 py-2 border-4 border-border">
            <span className="text-foreground">{String(transport.currentBar + 1).padStart(2, '0')}</span>
            <span className="text-primary">:</span>
            <span className="text-foreground">
              {String(Math.floor(transport.currentStep / (transport.stepResolution / 4)) + 1).padStart(2, '0')}
            </span>
            <span className="text-primary">:</span>
            <span className="text-muted-foreground">
              {String((transport.currentStep % (transport.stepResolution / 4)) + 1).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Export */}
        <button
          onClick={onExport}
          className="transport-button flex items-center gap-2 px-4"
        >
          <Download className="w-5 h-5" />
          <span className="font-pixel text-xs">EXPORT</span>
        </button>
      </div>
    </div>
  );
};
