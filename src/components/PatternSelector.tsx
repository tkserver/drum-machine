import { Pattern, PATTERN_COLORS } from '@/types/drumMachine';
import { cn } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const currentIndex = patterns.findIndex((p) => p.id === currentPatternId);

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-card/30">
      {/* Pattern tabs */}
      <div className="flex items-center gap-1">
        {patterns.map((pattern, index) => (
          <button
            key={pattern.id}
            onClick={() => onSelectPattern(pattern.id)}
            className={cn(
              'relative px-3 py-1.5 rounded-md font-mono text-xs transition-all',
              'border-2',
              pattern.id === currentPatternId
                ? cn(
                    PATTERN_COLORS[index % PATTERN_COLORS.length],
                    'border-foreground text-primary-foreground'
                  )
                : 'bg-secondary border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {pattern.name}
          </button>
        ))}
        <button
          onClick={onAddPattern}
          className="p-1.5 rounded-md bg-secondary hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-border" />

      {/* Pattern length */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">Length:</span>
        <Select
          value={currentPattern?.length.toString() || '16'}
          onValueChange={(val) => onSetLength(parseInt(val))}
        >
          <SelectTrigger className="w-20 h-7 font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[4, 8, 12, 16, 24, 32, 48, 64].map((len) => (
              <SelectItem key={len} value={len.toString()}>
                {len} steps
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Delete pattern */}
      {patterns.length > 1 && (
        <button
          onClick={() => onDeletePattern(currentPatternId)}
          className="p-1.5 rounded-md hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
