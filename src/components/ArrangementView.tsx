import { useState, useRef, useCallback, useEffect } from 'react';
import { Arrangement, Pattern, PATTERN_COLORS } from '@/types/drumMachine';
import { cn } from '@/lib/utils';
import { Plus, Trash2, GripHorizontal } from 'lucide-react';

interface ArrangementViewProps {
  arrangement: Arrangement;
  patterns: Pattern[];
  currentPatternId: string;
  onAddBlock: (patternId: string, startBar: number) => void;
  onRemoveBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, newStartBar: number) => void;
  onResizeBlock?: (blockId: string, newLength: number) => void;
  onSetLength?: (totalBars: number) => void;
  onSelectPattern: (patternId: string) => void;
}

export const ArrangementView = ({
  arrangement,
  patterns,
  currentPatternId,
  onAddBlock,
  onRemoveBlock,
  onMoveBlock,
  onResizeBlock,
  onSetLength,
  onSelectPattern,
}: ArrangementViewProps) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [draggedPattern, setDraggedPattern] = useState<string | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [dropIndicator, setDropIndicator] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const barWidth = 60;
  const trackHeight = 56;

  const getBarFromX = useCallback((clientX: number): number => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    const x = clientX - rect.left + scrollLeft;
    return Math.max(0, Math.floor(x / barWidth));
  }, [barWidth]);

  // Handle dragging from pattern library
  const handlePatternDragStart = (e: React.DragEvent, patternId: string) => {
    setDraggedPattern(patternId);
    e.dataTransfer.setData('patternId', patternId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handlePatternDragEnd = () => {
    setDraggedPattern(null);
    setDropIndicator(null);
  };

  // Handle dragging existing blocks
  const handleBlockMouseDown = (e: React.MouseEvent, blockId: string, block: typeof arrangement.blocks[0]) => {
    if ((e.target as HTMLElement).closest('.resize-handle')) return;
    e.preventDefault();
    
    const bar = getBarFromX(e.clientX);
    setDraggedBlock(blockId);
    setDragOffset(bar - block.startBar);
    setSelectedBlockId(blockId);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggedBlock && !isResizing) {
      const bar = Math.max(0, getBarFromX(e.clientX) - dragOffset);
      setDropIndicator(bar);
    }
  }, [draggedBlock, dragOffset, getBarFromX, isResizing]);

  const handleMouseUp = useCallback(() => {
    if (draggedBlock && dropIndicator !== null) {
      onMoveBlock(draggedBlock, dropIndicator);
    }
    setDraggedBlock(null);
    setDropIndicator(null);
    setIsResizing(false);
  }, [draggedBlock, dropIndicator, onMoveBlock]);

  useEffect(() => {
    if (draggedBlock) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedBlock, handleMouseMove, handleMouseUp]);

  // Handle drop from pattern library
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const patternId = e.dataTransfer.getData('patternId');
    if (patternId) {
      const bar = getBarFromX(e.clientX);
      onAddBlock(patternId, bar);
    }
    setDraggedPattern(null);
    setDropIndicator(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedPattern) {
      const bar = getBarFromX(e.clientX);
      setDropIndicator(bar);
    }
  };

  const handleDragLeave = () => {
    if (draggedPattern) {
      setDropIndicator(null);
    }
  };

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent, blockId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setDraggedBlock(blockId);
    setSelectedBlockId(blockId);
  };

  const getPatternColor = (patternId: string) => {
    const index = patterns.findIndex((p) => p.id === patternId);
    return PATTERN_COLORS[index % PATTERN_COLORS.length];
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden scanlines">
      {/* Header */}
      <div className="p-4 border-b-4 border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-pixel text-[10px] text-muted-foreground uppercase tracking-wider">
              Arrangement
            </h2>
            <h3 className="font-pixel-body text-2xl text-foreground">{arrangement.name}</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[8px] text-muted-foreground">BARS:</span>
              <select
                value={arrangement.totalBars}
                onChange={(e) => onSetLength?.(parseInt(e.target.value))}
                className="pixel-select px-2 py-1"
              >
                {[8, 16, 32, 64, 128].map((len) => (
                  <option key={len} value={len}>{len}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Pattern library */}
        <div className="w-44 shrink-0 border-r-4 border-border bg-card p-3 overflow-y-auto scrollbar-thin">
          <h3 className="font-pixel text-[8px] text-muted-foreground uppercase tracking-wider mb-3">
            Patterns
          </h3>
          <div className="space-y-2">
            {patterns.map((pattern, index) => (
              <div
                key={pattern.id}
                draggable
                onDragStart={(e) => handlePatternDragStart(e, pattern.id)}
                onDragEnd={handlePatternDragEnd}
                onClick={() => onSelectPattern(pattern.id)}
                className={cn(
                  'pattern-block p-2 cursor-grab active:cursor-grabbing',
                  PATTERN_COLORS[index % PATTERN_COLORS.length],
                  currentPatternId === pattern.id && 'border-foreground glow-green'
                )}
              >
                <span className="font-pixel text-[8px] text-primary-foreground block">
                  {pattern.name}
                </span>
                <span className="font-pixel-body text-sm text-primary-foreground/70">
                  {pattern.length} steps
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-2 border-4 border-dashed border-muted text-center">
            <p className="font-pixel text-[6px] text-muted-foreground leading-relaxed">
              DRAG TO<br/>TIMELINE
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Bar numbers */}
          <div className="flex border-b-4 border-border bg-card overflow-x-auto scrollbar-thin">
            <div className="flex">
              {Array.from({ length: arrangement.totalBars }).map((_, bar) => (
                <div
                  key={bar}
                  style={{ width: barWidth }}
                  className={cn(
                    'shrink-0 h-8 flex items-center justify-center',
                    'font-pixel-body text-lg',
                    bar % 4 === 0 ? 'text-foreground bg-muted/30' : 'text-muted-foreground',
                    'border-r-2 border-border'
                  )}
                >
                  {bar + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Arrangement track */}
          <div 
            ref={timelineRef}
            className="flex-1 overflow-auto scrollbar-thin sequencer-bg"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div 
              className="relative min-h-full"
              style={{ 
                width: arrangement.totalBars * barWidth,
                minHeight: trackHeight * 3,
              }}
            >
              {/* Grid lines */}
              {Array.from({ length: arrangement.totalBars }).map((_, bar) => (
                <div
                  key={bar}
                  className={cn(
                    'absolute top-0 bottom-0',
                    bar % 4 === 0 ? 'border-l-4 border-border' : 'border-l-2 border-grid-line'
                  )}
                  style={{ left: bar * barWidth }}
                />
              ))}

              {/* Drop indicator */}
              {dropIndicator !== null && (
                <div
                  className="absolute top-0 bottom-0 w-1 bg-primary glow-green z-20"
                  style={{ left: dropIndicator * barWidth }}
                />
              )}

              {/* Blocks */}
              {arrangement.blocks.map((block) => {
                const pattern = patterns.find((p) => p.id === block.patternId);
                if (!pattern) return null;
                
                const isDragging = draggedBlock === block.id;
                const displayBar = isDragging && dropIndicator !== null ? dropIndicator : block.startBar;

                return (
                  <div
                    key={block.id}
                    className={cn(
                      'absolute h-12 cursor-move flex items-center justify-between px-2 group',
                      getPatternColor(block.patternId),
                      'border-4 transition-transform',
                      selectedBlockId === block.id
                        ? 'border-foreground glow-green z-10'
                        : 'border-transparent hover:border-foreground/50',
                      isDragging && 'opacity-70'
                    )}
                    style={{
                      left: displayBar * barWidth + 2,
                      width: block.length * barWidth - 4,
                      top: 8,
                    }}
                    onMouseDown={(e) => handleBlockMouseDown(e, block.id, block)}
                    onClick={() => setSelectedBlockId(block.id)}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <GripHorizontal className="w-4 h-4 text-primary-foreground/50 shrink-0" />
                      <span className="font-pixel text-[8px] text-primary-foreground truncate">
                        {pattern.name}
                      </span>
                    </div>
                    
                    {selectedBlockId === block.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveBlock(block.id);
                          setSelectedBlockId(null);
                        }}
                        className="p-1 bg-destructive/80 hover:bg-destructive transition-colors shrink-0"
                      >
                        <Trash2 className="w-3 h-3 text-destructive-foreground" />
                      </button>
                    )}

                    {/* Resize handle */}
                    <div
                      className="resize-handle absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize bg-foreground/20 opacity-0 group-hover:opacity-100"
                      onMouseDown={(e) => handleResizeStart(e, block.id)}
                    />
                  </div>
                );
              })}

              {/* Empty state click zones */}
              {arrangement.blocks.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-4">
                    <p className="font-pixel text-[10px] text-muted-foreground mb-2">
                      DRAG PATTERNS HERE
                    </p>
                    <p className="font-pixel-body text-lg text-muted-foreground">
                      or click a pattern and drop it on the timeline
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-2 border-t-4 border-border bg-card">
        <p className="font-pixel text-[8px] text-muted-foreground text-center">
          DRAG FROM LIBRARY • CLICK TO SELECT • DRAG TO MOVE • DEL TO REMOVE
        </p>
      </div>
    </div>
  );
};
