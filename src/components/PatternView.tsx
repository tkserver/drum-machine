import { Pattern, Sound, TransportState } from '@/types/drumMachine';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX } from 'lucide-react';

interface PatternViewProps {
  pattern: Pattern;
  sounds: Sound[];
  transport: TransportState;
  onToggleStep: (trackId: string, stepIndex: number) => void;
  onToggleMute: (trackId: string) => void;
  onToggleSolo: (trackId: string) => void;
  onTriggerSound: (soundId: string) => void;
}

export const PatternView = ({
  pattern,
  sounds,
  transport,
  onToggleStep,
  onToggleMute,
  onToggleSolo,
  onTriggerSound,
}: PatternViewProps) => {
  const visibleSteps = pattern.length;
  const stepsPerBeat = transport.stepResolution / 4;
  const beatsPerBar = transport.timeSignature === '4/4' ? 4 : transport.timeSignature === '3/4' ? 3 : 6;

  const getStepClass = (stepIndex: number) => {
    const isBarStart = stepIndex % (stepsPerBeat * beatsPerBar) === 0;
    const isBeatStart = stepIndex % stepsPerBeat === 0;
    
    if (isBarStart) return 'border-l-2 border-l-grid-bar';
    if (isBeatStart) return 'border-l border-l-grid-beat';
    return 'border-l border-l-grid-line';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-mono text-sm text-muted-foreground uppercase tracking-wider">
              Pattern Editor
            </h2>
            <h3 className="font-semibold text-lg">{pattern.name}</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">Length:</span>
              <span className="font-mono text-sm text-foreground">{pattern.length} steps</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">Resolution:</span>
              <span className="font-mono text-sm text-foreground">1/{transport.stepResolution}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step numbers */}
      <div className="flex border-b border-border bg-card/50">
        <div className="w-32 shrink-0" />
        <div className="flex-1 flex overflow-x-auto scrollbar-thin">
          {Array.from({ length: visibleSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-8 shrink-0 h-6 flex items-center justify-center',
                'font-mono text-[10px] text-muted-foreground',
                getStepClass(i),
                transport.currentStep === i && transport.isPlaying && 'bg-step-current/20'
              )}
            >
              {i % stepsPerBeat === 0 ? i / stepsPerBeat + 1 : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Tracks */}
      <div className="flex-1 overflow-y-auto scrollbar-thin sequencer-bg">
        {pattern.tracks.map((track) => {
          const sound = sounds.find((s) => s.id === track.soundId);
          if (!sound) return null;

          return (
            <div
              key={track.id}
              className={cn(
                'flex border-b border-border/50 hover:bg-muted/20 transition-colors',
                track.muted && 'opacity-40'
              )}
            >
              {/* Track header */}
              <div className="w-32 shrink-0 flex items-center gap-2 px-2 py-1 border-r border-border bg-card/30">
                <button
                  onClick={() => onTriggerSound(sound.id)}
                  className={cn(
                    'w-2 h-8 rounded-sm transition-colors',
                    sound.color,
                    'hover:brightness-125'
                  )}
                />
                <span className="font-mono text-xs truncate flex-1">{sound.name}</span>
                <button
                  onClick={() => onToggleMute(track.id)}
                  className={cn(
                    'p-1 rounded hover:bg-muted transition-colors',
                    track.muted && 'text-destructive'
                  )}
                >
                  {track.muted ? (
                    <VolumeX className="w-3 h-3" />
                  ) : (
                    <Volume2 className="w-3 h-3 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => onToggleSolo(track.id)}
                  className={cn(
                    'font-mono text-[10px] px-1 rounded hover:bg-muted transition-colors',
                    track.solo && 'text-primary bg-primary/20'
                  )}
                >
                  S
                </button>
              </div>

              {/* Steps */}
              <div className="flex-1 flex overflow-x-auto scrollbar-thin">
                {Array.from({ length: visibleSteps }).map((_, stepIndex) => {
                  const step = track.steps[stepIndex];
                  const isCurrent = transport.currentStep === stepIndex && transport.isPlaying;

                  return (
                    <button
                      key={stepIndex}
                      onClick={() => onToggleStep(track.id, stepIndex)}
                      className={cn(
                        'step-button w-8 shrink-0',
                        getStepClass(stepIndex),
                        step?.active && 'active',
                        isCurrent && 'current'
                      )}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
