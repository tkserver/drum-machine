import { useState, useCallback } from 'react';
import { Sound } from '@/types/drumMachine';
import { cn } from '@/lib/utils';

interface DrumPadProps {
  sound: Sound;
  onTrigger: (soundId: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  keyLabel?: string;
}

export const DrumPad = ({ sound, onTrigger, isSelected, onSelect, keyLabel }: DrumPadProps) => {
  const [isTriggered, setIsTriggered] = useState(false);

  const handleTrigger = useCallback(() => {
    onTrigger(sound.id);
    setIsTriggered(true);
    setTimeout(() => setIsTriggered(false), 100);
  }, [sound.id, onTrigger]);

  const handleClick = useCallback(() => {
    handleTrigger();
    onSelect?.();
  }, [handleTrigger, onSelect]);

  return (
    <button
      className={cn(
        'drum-pad group',
        isTriggered && 'triggered active',
        isSelected && 'border-accent'
      )}
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Key label */}
      {keyLabel && (
        <div className="absolute top-1 left-1 w-6 h-6 bg-muted flex items-center justify-center border-2 border-border">
          <span className="font-pixel text-[8px] text-muted-foreground">{keyLabel}</span>
        </div>
      )}
      
      {/* Color indicator */}
      <div 
        className={cn(
          'absolute top-1 right-1 w-3 h-3',
          sound.color,
          'opacity-80 group-hover:opacity-100 transition-opacity'
        )} 
      />
      
      {/* Sound name */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-pixel text-[8px] text-muted-foreground group-hover:text-foreground transition-colors uppercase">
          {sound.name}
        </span>
      </div>
      
      {/* Active overlay */}
      <div 
        className={cn(
          'absolute inset-0 transition-opacity duration-75',
          'bg-primary/30',
          isTriggered ? 'opacity-100' : 'opacity-0'
        )} 
      />
    </button>
  );
};
