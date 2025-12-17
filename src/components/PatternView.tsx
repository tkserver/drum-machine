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
    if (isBarStart) return 'ml-1';
    return '';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b-4 border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-pixel text-xs text-muted-foreground uppercase tracking-wider">
              Pattern Editor
            </h2>
            <h3 className="font-pixel-body text-2xl text-foreground">{pattern.name}</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted px-3 py-2 border-2 border-border">
              <span className="font-pixel text-xs text-muted-foreground">LEN:</span>
              <span className="font-pixel-body text-xl text-foreground">{pattern.length}</span>
            </div>
            <div className="flex items-center gap-2 bg-muted px-3 py-2 border-2 border-border">
              <span className="font-pixel text-xs text-muted-foreground">RES:</span>
              <span className="font-pixel-body text-xl text-foreground">1/{transport.stepResolution}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step numbers */}
      <div className="flex border-b-2 border-border bg-card/50">
        <div className="w-32 shrink-0" />
        <div className="flex-1 flex overflow-x-auto scrollbar-thin">
          {Array.from({ length: visibleSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-10 shrink-0 h-8 flex items-center justify-center',
                'font-pixel-body text-lg',
                i % stepsPerBeat === 0 ? 'text-foreground' : 'text-muted-foreground/50',
                transport.currentStep === i && transport.isPlaying && 'bg-accent/30',
                getStepClass(i)
              )}
            >
              {i % stepsPerBeat === 0 ? Math.floor(i / stepsPerBeat) + 1 : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Tracks */}
      <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
        {pattern.tracks.map((track) => {
          const sound = sounds.find((s) => s.id === track.soundId);
          if (!sound) return null;

          return (
            <div
              key={track.id}
              className={cn(
                'flex border-b border-border/30 hover:bg-muted/10 transition-colors',
                track.muted && 'opacity-40'
              )}
            >
              {/* Track header */}
              <div className="w-32 shrink-0 flex items-center gap-2 px-3 py-2 border-r-2 border-border bg-card/50">
                <button
                  onClick={() => onTriggerSound(sound.id)}
                  className={cn(
                    'w-4 h-10 transition-colors',
                    sound.color,
                    'hover:brightness-125'
                  )}
                />
                <span className="font-pixel text-xs truncate flex-1 text-foreground">
                  {sound.name}
                </span>
                <button
                  onClick={() => onToggleMute(track.id)}
                  className={cn(
                    'p-1 transition-colors',
                    track.muted ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {track.muted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => onToggleSolo(track.id)}
                  className={cn(
                    'font-pixel text-xs px-1 transition-colors',
                    track.solo ? 'text-accent bg-accent/20' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  S
                </button>
              </div>

              {/* Steps */}
              <div className="flex-1 flex overflow-x-auto scrollbar-thin py-1">
                {Array.from({ length: visibleSteps }).map((_, stepIndex) => {
                  const step = track.steps[stepIndex];
                  const isCurrent = transport.currentStep === stepIndex && transport.isPlaying;

                  return (
                    <button
                      key={stepIndex}
                      onClick={() => onToggleStep(track.id, stepIndex)}
                      className={cn(
                        'step-button w-10 shrink-0 mx-px rounded-sm',
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
