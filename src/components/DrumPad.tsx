import { useState, useCallback } from 'react';
import { Sound } from '@/types/drumMachine';
import { cn } from '@/lib/utils';

interface DrumPadProps {
  sound: Sound;
  onTrigger: (soundId: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const DrumPad = ({ sound, onTrigger, isSelected, onSelect }: DrumPadProps) => {
  const [isTriggered, setIsTriggered] = useState(false);

  const handleTrigger = useCallback(() => {
    onTrigger(sound.id);
    setIsTriggered(true);
    setTimeout(() => setIsTriggered(false), 150);
  }, [sound.id, onTrigger]);

  const handleClick = useCallback(() => {
    handleTrigger();
    onSelect?.();
  }, [handleTrigger, onSelect]);

  return (
    <button
      className={cn(
        'drum-pad group',
        isTriggered && 'triggered',
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Color indicator */}
      <div 
        className={cn(
          'absolute top-2 left-2 w-2 h-2 rounded-full',
          sound.color,
          'opacity-60 group-hover:opacity-100 transition-opacity'
        )} 
      />
      
      {/* Sound name */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider">
          {sound.name}
        </span>
      </div>
      
      {/* Glow effect on trigger */}
      <div 
        className={cn(
          'absolute inset-0 rounded-lg transition-opacity duration-150',
          'bg-primary/20',
          isTriggered ? 'opacity-100' : 'opacity-0'
        )} 
      />
    </button>
  );
};
