import { Pattern, PATTERN_COLORS } from '@/types/drumMachine';
import { cn } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

interface PatternSelectorProps {
  patterns: Pattern[];
  currentPatternId: string;
  onSelectPattern: (patternId: string) => void;
  onAddPattern: () => void;
  onDeletePattern: (patternId: string) => void;
  onSetLength: (length: number) => void;
}

export const PatternSelector = ({
  patterns,
  currentPatternId,
  onSelectPattern,
  onAddPattern,
  onDeletePattern,
  onSetLength,
}: PatternSelectorProps) => {
  const currentPattern = patterns.find((p) => p.id === currentPatternId);

  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b-4 border-border bg-card/50">
      {/* Pattern tabs */}
      <div className="flex items-center gap-1">
        {patterns.map((pattern, index) => (
          <button
            key={pattern.id}
            onClick={() => onSelectPattern(pattern.id)}
            className={cn(
              'px-3 py-1 font-pixel text-[8px] transition-all border-4',
              pattern.id === currentPatternId
                ? cn(
                    PATTERN_COLORS[index % PATTERN_COLORS.length],
                    'border-foreground text-primary-foreground glow-green'
                  )
                : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
            )}
          >
            P{index + 1}
          </button>
        ))}
        <button
          onClick={onAddPattern}
          className="p-1 bg-muted border-4 border-border hover:border-primary/50 transition-colors text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Separator */}
      <div className="h-6 w-1 bg-border" />

      {/* Pattern length */}
      <div className="flex items-center gap-2">
        <span className="font-pixel text-[8px] text-muted-foreground">STEPS:</span>
        <select
          value={currentPattern?.length || 16}
          onChange={(e) => onSetLength(parseInt(e.target.value))}
          className="pixel-select px-2 py-1 text-sm"
        >
          {[4, 8, 12, 16, 24, 32, 48, 64].map((len) => (
            <option key={len} value={len}>{len}</option>
          ))}
        </select>
      </div>

      {/* Delete pattern */}
      {patterns.length > 1 && (
        <button
          onClick={() => onDeletePattern(currentPatternId)}
          className="p-1 border-4 border-border hover:bg-destructive/20 hover:border-destructive/50 transition-colors text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
