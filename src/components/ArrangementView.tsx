import { useState } from 'react';
import { Arrangement, Pattern, PATTERN_COLORS } from '@/types/drumMachine';
import { cn } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

interface ArrangementViewProps {
  arrangement: Arrangement;
  patterns: Pattern[];
  currentPatternId: string;
  onAddBlock: (patternId: string, startBar: number) => void;
  onRemoveBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, newStartBar: number) => void;
  onSelectPattern: (patternId: string) => void;
}

export const ArrangementView = ({
  arrangement,
  patterns,
  currentPatternId,
  onAddBlock,
  onRemoveBlock,
  onMoveBlock,
  onSelectPattern,
}: ArrangementViewProps) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [draggedPattern, setDraggedPattern] = useState<string | null>(null);

  const barWidth = 80;
  const trackHeight = 60;

  const handleDrop = (e: React.DragEvent, bar: number) => {
    e.preventDefault();
    if (draggedPattern) {
      onAddBlock(draggedPattern, bar);
      setDraggedPattern(null);
    }
  };

  const getPatternColor = (patternId: string) => {
    const index = patterns.findIndex((p) => p.id === patternId);
    return PATTERN_COLORS[index % PATTERN_COLORS.length];
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-mono text-sm text-muted-foreground uppercase tracking-wider">
              Arrangement
            </h2>
            <h3 className="font-semibold text-lg">{arrangement.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {arrangement.totalBars} bars
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Pattern library */}
        <div className="w-48 shrink-0 border-r border-border bg-card/30 p-4 overflow-y-auto">
          <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-3">
            Patterns
          </h3>
          <div className="space-y-2">
            {patterns.map((pattern, index) => (
              <div
                key={pattern.id}
                draggable
                onDragStart={() => setDraggedPattern(pattern.id)}
                onDragEnd={() => setDraggedPattern(null)}
                onClick={() => onSelectPattern(pattern.id)}
                className={cn(
                  'pattern-block p-3 cursor-grab active:cursor-grabbing',
                  PATTERN_COLORS[index % PATTERN_COLORS.length],
                  currentPatternId === pattern.id && 'ring-2 ring-foreground'
                )}
              >
                <span className="font-mono text-xs text-primary-foreground font-semibold">
                  {pattern.name}
                </span>
                <span className="block font-mono text-[10px] text-primary-foreground/70 mt-1">
                  {pattern.length} steps
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Bar numbers */}
          <div className="flex border-b border-border bg-card/50 overflow-x-auto scrollbar-thin">
            {Array.from({ length: arrangement.totalBars }).map((_, bar) => (
              <div
                key={bar}
                style={{ width: barWidth }}
                className={cn(
                  'shrink-0 h-8 flex items-center justify-center',
                  'font-mono text-xs text-muted-foreground',
                  'border-r border-border',
                  bar % 4 === 0 && 'bg-muted/20'
                )}
              >
                {bar + 1}
              </div>
            ))}
          </div>

          {/* Arrangement track */}
          <div 
            className="flex-1 overflow-auto scrollbar-thin sequencer-bg p-4"
            onDragOver={(e) => e.preventDefault()}
          >
            <div 
              className="relative"
              style={{ 
                width: arrangement.totalBars * barWidth,
                minHeight: trackHeight * 2,
              }}
            >
              {/* Grid lines */}
              {Array.from({ length: arrangement.totalBars }).map((_, bar) => (
                <div
                  key={bar}
                  className={cn(
                    'absolute top-0 bottom-0 border-l',
                    bar % 4 === 0 ? 'border-grid-bar' : 'border-grid-line'
                  )}
                  style={{ left: bar * barWidth }}
                />
              ))}

              {/* Drop zones */}
              {Array.from({ length: arrangement.totalBars }).map((_, bar) => (
                <div
                  key={bar}
                  className="absolute top-0 h-full hover:bg-primary/10 transition-colors"
                  style={{ 
                    left: bar * barWidth, 
                    width: barWidth,
                  }}
                  onDrop={(e) => handleDrop(e, bar)}
                  onDragOver={(e) => e.preventDefault()}
                />
              ))}

              {/* Blocks */}
              {arrangement.blocks.map((block) => {
                const pattern = patterns.find((p) => p.id === block.patternId);
                if (!pattern) return null;

                return (
                  <div
                    key={block.id}
                    className={cn(
                      'absolute top-2 h-14 rounded-md cursor-pointer',
                      'flex items-center justify-between px-2',
                      'border-2 transition-all',
                      getPatternColor(block.patternId),
                      selectedBlockId === block.id
                        ? 'border-foreground shadow-lg scale-105'
                        : 'border-transparent hover:border-foreground/30'
                    )}
                    style={{
                      left: block.startBar * barWidth + 2,
                      width: block.length * barWidth - 4,
                    }}
                    onClick={() => setSelectedBlockId(block.id)}
                  >
                    <span className="font-mono text-xs text-primary-foreground font-semibold truncate">
                      {pattern.name}
                    </span>
                    {selectedBlockId === block.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveBlock(block.id);
                          setSelectedBlockId(null);
                        }}
                        className="p-1 rounded bg-background/20 hover:bg-background/40 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-3 border-t border-border bg-card/30">
        <p className="font-mono text-xs text-muted-foreground">
          Drag patterns from the library to the timeline. Click a block to select it, then delete with the trash icon.
        </p>
      </div>
    </div>
  );
};
