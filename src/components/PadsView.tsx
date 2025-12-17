import { Sound } from '@/types/drumMachine';
import { DrumPad } from './DrumPad';

interface PadsViewProps {
  sounds: Sound[];
  onTrigger: (soundId: string) => void;
  selectedSoundId?: string | null;
  onSelectSound?: (soundId: string) => void;
}

const KEY_LABELS = ['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F', 'Z', 'X', 'C', 'V', '1', '2', '3', '4'];

export const PadsView = ({ sounds, onTrigger, selectedSoundId, onSelectSound }: PadsViewProps) => {
  return (
    <div className="flex-1 p-6 overflow-auto scanlines">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-pixel text-[10px] text-muted-foreground uppercase tracking-wider mb-4">
          Drum Pads
        </h2>
        
        <div className="grid grid-cols-4 gap-3">
          {sounds.map((sound, index) => (
            <DrumPad
              key={sound.id}
              sound={sound}
              onTrigger={onTrigger}
              isSelected={selectedSoundId === sound.id}
              onSelect={() => onSelectSound?.(sound.id)}
              keyLabel={KEY_LABELS[index]}
            />
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-card border-4 border-border">
          <h3 className="font-pixel text-[8px] text-muted-foreground uppercase tracking-wider mb-3">
            Keyboard Controls
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {KEY_LABELS.map((key, i) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center bg-muted border-2 border-border font-pixel text-[8px] text-foreground">
                  {key}
                </span>
                <span className="font-pixel-body text-sm text-muted-foreground truncate">
                  {sounds[i]?.name || '-'}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t-2 border-border">
            <p className="font-pixel text-[8px] text-muted-foreground">
              SPACE = PLAY/PAUSE • ESC = STOP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
