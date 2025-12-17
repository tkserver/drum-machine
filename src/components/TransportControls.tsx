import { TransportState } from '@/types/drumMachine';
import { cn } from '@/lib/utils';
import { Play, Pause, Square, Download } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TransportControlsProps {
  transport: TransportState;
  onTogglePlay: () => void;
  onStop: () => void;
  onSetBpm: (bpm: number) => void;
  onSetResolution: (resolution: 4 | 8 | 16 | 32) => void;
  onSetTripletMode: (mode: 'straight' | 'triplet') => void;
  onExport?: () => void;
}

export const TransportControls = ({
  transport,
  onTogglePlay,
  onStop,
  onSetBpm,
  onSetResolution,
  onSetTripletMode,
  onExport,
}: TransportControlsProps) => {
  return (
    <div className="transport-gradient border-t border-border px-6 py-4">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Play controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePlay}
            className={cn('transport-button', transport.isPlaying && 'playing')}
          >
            {transport.isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>
          <button onClick={onStop} className="transport-button">
            <Square className="w-4 h-4" />
          </button>
        </div>

        {/* BPM */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              BPM
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={transport.bpm}
                onChange={(e) => onSetBpm(parseInt(e.target.value) || 120)}
                className="w-16 bg-secondary border border-border rounded px-2 py-1 font-mono text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary"
                min={20}
                max={300}
              />
              <div className="w-32">
                <Slider
                  value={[transport.bpm]}
                  onValueChange={([val]) => onSetBpm(val)}
                  min={20}
                  max={300}
                  step={1}
                  className="cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resolution & Triplet */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              Resolution
            </span>
            <Select
              value={transport.stepResolution.toString()}
              onValueChange={(val) => onSetResolution(parseInt(val) as 4 | 8 | 16 | 32)}
            >
              <SelectTrigger className="w-20 h-8 font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">1/4</SelectItem>
                <SelectItem value="8">1/8</SelectItem>
                <SelectItem value="16">1/16</SelectItem>
                <SelectItem value="32">1/32</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col items-center">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              Grid
            </span>
            <div className="flex rounded-lg overflow-hidden border border-border">
              <button
                onClick={() => onSetTripletMode('straight')}
                className={cn(
                  'px-3 py-1 font-mono text-xs transition-colors',
                  transport.tripletMode === 'straight'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                Straight
              </button>
              <button
                onClick={() => onSetTripletMode('triplet')}
                className={cn(
                  'px-3 py-1 font-mono text-xs transition-colors',
                  transport.tripletMode === 'triplet'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                Triplet
              </button>
            </div>
          </div>
        </div>

        {/* Position display */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              Position
            </span>
            <div className="font-mono text-lg tabular-nums">
              <span className="text-foreground">{transport.currentBar + 1}</span>
              <span className="text-muted-foreground">.</span>
              <span className="text-foreground">
                {String(Math.floor(transport.currentStep / (transport.stepResolution / 4)) + 1).padStart(2, '0')}
              </span>
              <span className="text-muted-foreground">.</span>
              <span className="text-muted-foreground">
                {String((transport.currentStep % (transport.stepResolution / 4)) + 1).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Export */}
        <button
          onClick={onExport}
          className="transport-button flex items-center gap-2 px-4"
        >
          <Download className="w-4 h-4" />
          <span className="font-mono text-xs uppercase tracking-wider">Export</span>
        </button>
      </div>
    </div>
  );
};
