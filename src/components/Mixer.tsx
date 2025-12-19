import { Sound } from '@/types/drumMachine';
import { useState } from 'react';

interface MixerProps {
  sounds: Sound[];
  onVolumeChange: (soundId: string, volume: number) => void;
  onPanChange: (soundId: string, pan: number) => void;
  onTrigger: (soundId: string, pan?: number) => void;
}

export const Mixer = ({ sounds, onVolumeChange, onPanChange, onTrigger }: MixerProps) => {
  const [expanded, setExpanded] = useState(false);

  const handleVolumeChange = (soundId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    onVolumeChange(soundId, volume);
  };

  const handlePanChange = (soundId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const pan = parseFloat(e.target.value);
    onPanChange(soundId, pan);
  };

  return (
    <div className="w-full sequencer-bg">
      <div className="flex items-center justify-between p-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded-full glow-green"></div>
          <h3 className="font-pixel text-base">MIXER</h3>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="nav-button text-xs"
        >
          {expanded ? 'COLLAPSE' : 'EXPAND'}
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-2 p-2">
        {sounds.map((sound) => (
          <div key={sound.id} className="bg-card p-2 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${sound.color} border-2 border-border`}></div>
                <span className="font-pixel text-xs uppercase">{sound.name}</span>
                <button
                  onClick={() => onTrigger(sound.id, sound.pan)}
                  className="ml-2 px-2 py-1 text-xs bg-primary hover:bg-primary/80 text-primary-foreground rounded transition-colors"
                  title={`Play ${sound.name}`}
                >
                  ▶
                </button>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">V:</span>
                <span className="font-pixel text-xs w-10 text-right">{sound.volume.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">P:</span>
                <span className="font-pixel text-xs w-8 text-right">{sound.pan.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground font-pixel">VOL</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.01"
                  value={sound.volume}
                  onChange={(e) => handleVolumeChange(sound.id, e)}
                  className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-muted-foreground w-12">0-2</span>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground font-pixel">PAN</label>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={sound.pan}
                  onChange={(e) => handlePanChange(sound.id, e)}
                  className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-muted-foreground w-12">L-C-R</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
