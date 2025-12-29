import { TransportState, TimeSignature } from '@/types/drumMachine';
import { cn } from '@/lib/utils';
import { Play, Pause, Square, SkipBack, Download } from 'lucide-react';

interface TransportControlsProps {
  transport: TransportState;
  onTogglePlay: () => void;
  onStop: () => void;
  onStartFromBeginning: () => void;
  onSetBpm: (bpm: number) => void;
  onSetResolution: (resolution: 4 | 8 | 16 | 32) => void;
  onSetTripletMode: (mode: 'straight' | 'triplet') => void;
  onSetTimeSignature?: (sig: TimeSignature) => void;
  onSetLoopEnabled?: (enabled: boolean) => void;
  onSetLoopPoints?: (startBar: number, endBar: number) => void;
  onExport?: () => void;
}

export const TransportControls = ({
  transport,
  onTogglePlay,
  onStop,
  onStartFromBeginning,
  onSetBpm,
  onSetResolution,
  onSetTripletMode,
  onSetTimeSignature,
  onSetLoopEnabled,
  onSetLoopPoints,
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 xl:grid-cols-10 gap-4 max-w-7xl mx-auto">
        {/* Play controls */}
        <div className="flex items-center gap-2 col-span-2">
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
          <button onClick={onStartFromBeginning} className="transport-button" title="Start from Beginning">
            <SkipBack className="w-5 h-5" />
          </button>
          <button onClick={onStop} className="transport-button" title="Stop">
            <Square className="w-5 h-5" />
          </button>
        </div>

        {/* BPM Section */}
        <div className="flex flex-col items-center">
          <span className="font-pixel text-xs text-muted-foreground mb-1">BPM</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={transport.bpm}
              onChange={(e) => onSetBpm(parseInt(e.target.value) || 120)}
              className="pixel-input w-16 text-center text-lg"
              min={20}
              max={300}
            />
          </div>
          <div className="flex gap-1 mt-1">
            {tempoPresets.slice(0, 2).map((preset) => (
              <button
                key={preset.label}
                onClick={() => onSetBpm(preset.bpm)}
                className={cn(
                  'px-2 py-1 font-pixel text-xs border-2 transition-all',
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

        {/* Time Signature & Resolution */}
        <div className="flex flex-col items-center">
          <span className="font-pixel text-xs text-muted-foreground mb-1">TIME</span>
          <div className="flex gap-1 mb-1">
            {(['4/4', '3/4'] as TimeSignature[]).map((sig) => (
              <button
                key={sig}
                onClick={() => onSetTimeSignature?.(sig)}
                className={cn(
                  'px-2 py-1 font-pixel-body text-lg border-2 transition-all',
                  transport.timeSignature === sig
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                )}
              >
                {sig}
              </button>
            ))}
          </div>
          <span className="font-pixel text-xs text-muted-foreground mb-1">GRID</span>
          <div className="flex gap-1">
            {([16, 32] as const).map((res) => (
              <button
                key={res}
                onClick={() => onSetResolution(res as 4 | 8 | 16 | 32)}
                className={cn(
                  'px-2 py-1 font-pixel-body text-lg border-2 transition-all min-w-[40px]',
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

        {/* Mode Controls */}
        <div className="flex flex-col items-center">
          <span className="font-pixel text-xs text-muted-foreground mb-1">MODE</span>
          <div className="flex border-4 border-border overflow-hidden mb-2">
            <button
              onClick={() => onSetTripletMode('straight')}
              className={cn(
                'px-3 py-2 font-pixel text-xs transition-all',
                transport.tripletMode === 'straight'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-card'
              )}
              title="Straight timing - Normal rhythm"
            >
              STR
            </button>
            <button
              onClick={() => onSetTripletMode('triplet')}
              className={cn(
                'px-3 py-2 font-pixel text-xs transition-all',
                transport.tripletMode === 'triplet'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-card'
              )}
              title="Triplet timing - Swing rhythm"
            >
              TRP
            </button>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            <div>Straight/Triplet</div>
            <div>Timing Mode</div>
          </div>
        </div>

        {/* Loop Controls - Enhanced with permanent value display */}
        <div className="flex flex-col items-center">
          <span className="font-pixel text-xs text-muted-foreground mb-1">LOOP</span>
          <div className="flex flex-col gap-2 w-full">
            {/* Loop Enable Button */}
            <button
              onClick={() => onSetLoopEnabled?.(!transport.loop.enabled)}
              className={cn(
                'px-3 py-2 font-pixel text-sm border-2 transition-all rounded',
                transport.loop.enabled
                  ? 'bg-orange-500 text-orange-100 border-orange-500 glow-orange'
                  : 'bg-muted text-muted-foreground border-border hover:border-orange-500/50'
              )}
              title="Enable/Disable Loop"
            >
              {transport.loop.enabled ? 'LOOP ON' : 'LOOP OFF'}
            </button>
            
            {/* Loop Points with Enhanced Display */}
            <div className="flex items-center justify-center gap-2">
              <div className="flex flex-col items-center">
                <label className="font-pixel text-xs text-muted-foreground mb-1">START</label>
                <div className="relative">
                  <input
                    type="number"
                    value={transport.loop.startBar + 1}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      onSetLoopPoints?.(value - 1, transport.loop.endBar);
                    }}
                    className="w-14 h-8 px-2 text-center text-sm font-pixel-body bg-card border-2 border-border rounded focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    min={1}
                    max={999}
                    title="Loop Start Bar"
                  />
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-orange-500 font-pixel">
                    {transport.loop.startBar + 1}
                  </div>
                </div>
              </div>
              
              <div className="font-pixel-body text-lg text-muted-foreground self-center">→</div>
              
              <div className="flex flex-col items-center">
                <label className="font-pixel text-xs text-muted-foreground mb-1">END</label>
                <div className="relative">
                  <input
                    type="number"
                    value={transport.loop.endBar + 1}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      onSetLoopPoints?.(transport.loop.startBar, value - 1);
                    }}
                    className="w-14 h-8 px-2 text-center text-sm font-pixel-body bg-card border-2 border-border rounded focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    min={1}
                    max={999}
                    title="Loop End Bar"
                  />
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-orange-500 font-pixel">
                    {transport.loop.endBar + 1}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Loop Range Display */}
            {transport.loop.enabled && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded px-2 py-1">
                <div className="text-xs text-orange-600 font-pixel text-center">
                  BARS {transport.loop.startBar + 1}-{transport.loop.endBar + 1}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Position display */}
        <div className="flex flex-col items-center">
          <span className="font-pixel text-xs text-muted-foreground mb-1">POSITION</span>
          <div className="font-pixel-body text-2xl tabular-nums bg-muted px-2 py-1 border-2 border-border">
            <span className="text-foreground">{String(transport.currentBar + 1).padStart(2, '0')}</span>
            <span className="text-primary">:</span>
            <span className="text-foreground">
              {String(Math.floor(transport.currentStep / (transport.stepResolution / 4)) + 1).padStart(2, '0')}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Bar:Beat
          </div>
        </div>

        {/* Export */}
        <div className="flex items-center justify-center">
          <button
            onClick={onExport}
            className="transport-button flex items-center gap-2 px-3 py-2"
            title="Export Pattern"
          >
            <Download className="w-4 h-4" />
            <span className="font-pixel text-xs">EXPORT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
