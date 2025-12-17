import { Sound } from '@/types/drumMachine';
import { DrumPad } from './DrumPad';

interface PadsViewProps {
  sounds: Sound[];
  onTrigger: (soundId: string) => void;
  selectedSoundId?: string | null;
  onSelectSound?: (soundId: string) => void;
}

export const PadsView = ({ sounds, onTrigger, selectedSoundId, onSelectSound }: PadsViewProps) => {
  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-mono text-sm text-muted-foreground uppercase tracking-wider mb-6">
          Drum Pads
        </h2>
        
        <div className="grid grid-cols-4 gap-4">
          {sounds.map((sound) => (
            <DrumPad
              key={sound.id}
              sound={sound}
              onTrigger={onTrigger}
              isSelected={selectedSoundId === sound.id}
              onSelect={() => onSelectSound?.(sound.id)}
            />
          ))}
        </div>
        
        <div className="mt-8 p-4 bg-card rounded-lg border border-border">
          <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-3">
            Keyboard Shortcuts
          </h3>
          <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground font-mono">
            {['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F', 'Z', 'X', 'C', 'V', '1', '2', '3', '4'].map((key, i) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center bg-secondary rounded text-foreground">
                  {key}
                </span>
                <span className="truncate">{sounds[i]?.name || '-'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
