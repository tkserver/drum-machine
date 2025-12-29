import { useState, useRef, useCallback, useEffect } from 'react';
import { Arrangement, Pattern, PATTERN_COLORS } from '@/types/drumMachine';
import { cn } from '@/lib/utils';
import { Plus, Trash2, GripHorizontal } from 'lucide-react';

interface ArrangementViewProps {
  arrangement: Arrangement;
  patterns: Pattern[];
  currentPatternId: string;
  transport: {
    timelinePosition: {
      timelineBar: number;
      timelineStep: number;
    };
    arrangementPosition: {
      currentBlockIndex: number;
      currentBlock: string | null;
      currentBlockStep: number;
      currentBlockBar: number;
      currentBarStep: number;
    };
    isPlaying: boolean;
    stepResolution: number;
    loop?: {
      enabled: boolean;
      startBar: number;
      endBar: number;
    };
  };
  onAddBlock: (patternId: string, startBar: number) => void;
  onRemoveBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, newStartBar: number) => void;
  onResizeBlock?: (blockId: string, newLength: number) => void;
  onSetLength?: (totalBars: number) => void;
  onSelectPattern: (patternId: string) => void;
  onJumpToPosition?: (bar: number, step?: number) => void;
}

export const ArrangementView = ({
  arrangement,
  patterns,
  currentPatternId,
  transport,
  onAddBlock,
  onRemoveBlock,
  onMoveBlock,
  onResizeBlock,
  onSetLength,
  onSelectPattern,
  onJumpToPosition,
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

  // Handle timeline click to jump to position
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (onJumpToPosition && !draggedPattern && !draggedBlock) {
      const bar = getBarFromX(e.clientX);
      const stepResolution = transport.stepResolution;
      const rect = timelineRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left + (timelineRef.current?.scrollLeft || 0);
        const step = Math.floor((x % barWidth) / barWidth * stepResolution);
        onJumpToPosition(bar, Math.max(0, Math.min(stepResolution - 1, step)));
      } else {
        onJumpToPosition(bar, 0);
      }
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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b-4 border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-pixel text-xs text-muted-foreground uppercase tracking-wider">
              Arrangement
            </h2>
            <h3 className="font-pixel-body text-2xl text-foreground">{arrangement.name}</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-pixel text-xs text-muted-foreground">BARS:</span>
              <select
                value={arrangement.totalBars}
                onChange={(e) => onSetLength?.(parseInt(e.target.value))}
                className="pixel-select px-3 py-2 text-lg"
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
        <div className="w-48 shrink-0 border-r-4 border-border bg-card p-4 overflow-y-auto scrollbar-thin">
          <h3 className="font-pixel text-xs text-muted-foreground uppercase tracking-wider mb-3">
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
                  'pattern-block p-3 cursor-grab active:cursor-grabbing',
                  PATTERN_COLORS[index % PATTERN_COLORS.length],
                  currentPatternId === pattern.id && 'border-foreground glow-green'
                )}
              >
                <span className="font-pixel text-xs text-primary-foreground block">
                  {pattern.name}
                </span>
                <span className="font-pixel-body text-lg text-primary-foreground/70">
                  {pattern.length} steps
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 border-4 border-dashed border-muted text-center">
            <p className="font-pixel text-xs text-muted-foreground leading-relaxed">
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
                    'shrink-0 h-10 flex items-center justify-center',
                    'font-pixel-body text-xl',
                    bar % 4 === 0 ? 'text-foreground bg-muted/30' : 'text-muted-foreground'
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
            className="flex-1 overflow-auto scrollbar-thin bg-background"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleTimelineClick}
          >
            <div 
              className="relative min-h-full"
              style={{ 
                width: arrangement.totalBars * barWidth,
                minHeight: trackHeight * 3,
              }}
            >
              {/* Grid lines - only on bar boundaries */}
              {Array.from({ length: arrangement.totalBars }).map((_, bar) => (
                bar % 4 === 0 && (
                  <div
                    key={bar}
                    className="absolute top-0 bottom-0 border-l-2 border-border/30"
                    style={{ left: bar * barWidth }}
                  />
                )
              ))}

              {/* Drop indicator */}
              {dropIndicator !== null && (
                <div
                  className="absolute top-0 bottom-0 w-1 bg-primary glow-green z-20"
                  style={{ left: dropIndicator * barWidth }}
                />
              )}

              {/* Smooth playback cursor with independent timeline positioning */}
              {transport.isPlaying && (() => {
                const currentBar = transport.timelinePosition.timelineBar;
                const currentStep = transport.timelinePosition.timelineStep;
                const stepResolution = transport.stepResolution;
                
                // Ensure smooth cursor progression through all timeline steps
                const safeStep = Math.max(0, Math.min(stepResolution - 1, currentStep));
                
                // Calculate precise cursor position with sub-step precision for smooth movement
                const stepPosition = safeStep / stepResolution;
                const cursorLeft = (currentBar + stepPosition) * barWidth;
                
                // DEBUG LOG: Only log significant cursor movements to avoid spam
                if (currentStep % 4 === 0 || currentStep === 0) {
                  console.log('🎵 VIEW DEBUG - independent timeline cursor:', {
                    currentBar,
                    currentStep,
                    safeStep,
                    stepResolution,
                    stepPosition,
                    cursorLeft: Math.round(cursorLeft),
                    barWidth,
                    timestamp: Date.now()
                  });
                }
                
                return (
                  <>
                    {/* Primary cursor line with smooth animation */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-accent glow-accent z-30 transition-all duration-75 ease-linear"
                      style={{ 
                        left: cursorLeft,
                        willChange: 'left'
                      }}
                      title={`Timeline: Bar ${currentBar + 1}, Step ${safeStep + 1}/${stepResolution}`}
                    />
                    
                    {/* Enhanced active region highlight for current bar */}
                    <div
                      className="absolute top-0 bottom-0 bg-accent/8 z-20 pointer-events-none border-l-2 border-accent/20"
                      style={{
                        left: currentBar * barWidth,
                        width: barWidth,
                      }}
                    />
                    
                    {/* Step grid highlight for current step with pulse animation */}
                    <div
                      className="absolute top-0 bottom-0 bg-accent/5 z-10 pointer-events-none animate-pulse"
                      style={{
                        left: (currentBar + stepPosition) * barWidth - 1,
                        width: (barWidth / stepResolution) + 2,
                      }}
                    />
                    
                    {/* Progress indicator for current step */}
                    <div
                      className="absolute top-0 h-1 bg-accent z-40 pointer-events-none"
                      style={{
                        left: (currentBar + stepPosition) * barWidth,
                        width: (barWidth / stepResolution) * 0.8,
                      }}
                    />
                  </>
                );
              })()}
              
              {/* Enhanced beat indicators with smooth highlighting based on independent timeline */}
              {transport.isPlaying && (() => {
                const currentBar = transport.timelinePosition.timelineBar;
                const currentStep = transport.timelinePosition.timelineStep;
                const stepResolution = transport.stepResolution;
                
                // Show beat indicators at quarter note boundaries
                const beatsPerBar = 4;
                const stepsPerBeat = stepResolution / 4;
                const beatMarkers = [];
                
                for (let beat = 0; beat < beatsPerBar; beat++) {
                  const beatStep = beat * stepsPerBeat;
                  const beatPosition = beatStep / stepResolution;
                  const beatLeft = (currentBar + beatPosition) * barWidth;
                  
                  // Highlight current beat based on independent timeline
                  const isCurrentBeat = Math.floor(currentStep / stepsPerBeat) === beat;
                  
                  beatMarkers.push(
                    <div
                      key={beat}
                      className={`absolute top-0 bottom-0 z-20 transition-colors duration-150 ${
                        isCurrentBeat ? 'w-0.5 bg-accent' : 'w-px bg-accent/30'
                      }`}
                      style={{ left: beatLeft }}
                    />
                  );
                }
                
                return beatMarkers;
              })()}

              {/* Blocks */}
              {arrangement.blocks.map((block) => {
                const pattern = patterns.find((p) => p.id === block.patternId);
                if (!pattern) return null;
                
                const isDragging = draggedBlock === block.id;
                const displayBar = isDragging && dropIndicator !== null ? dropIndicator : block.startBar;
                const isCurrentlyPlaying = transport.isPlaying && 
                  transport.arrangementPosition.currentBlock === block.patternId;

                return (
                  <div
                    key={block.id}
                    className={cn(
                      'absolute h-12 cursor-move flex items-center justify-between px-2 group',
                      getPatternColor(block.patternId),
                      'border-4 transition-all duration-200',
                      selectedBlockId === block.id
                        ? 'border-foreground glow-green z-10'
                        : 'border-transparent hover:border-foreground/50',
                      isCurrentlyPlaying && 'ring-2 ring-accent ring-opacity-60 shadow-lg shadow-accent/25 bg-gradient-to-r from-accent/10 to-accent/5',
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
                      <GripHorizontal className="w-5 h-5 text-primary-foreground/50 shrink-0" />
                      <span className="font-pixel text-xs text-primary-foreground truncate">
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
              
              {/* Loop indicators with bar numbers */}
              {transport.loop && (() => {
                const loopEnabled = transport.loop.enabled;
                const loopStartBar = transport.loop.startBar;
                const loopEndBar = transport.loop.endBar;
                
                if (!loopEnabled) return null;
                
                return (
                  <>
                    {/* Loop start indicator with bar number */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-25"
                      style={{ left: loopStartBar * barWidth }}
                      title={`Loop Start: Bar ${loopStartBar + 1}`}
                    />
                    <div
                      className="absolute top-0 bg-orange-500 text-orange-100 text-xs font-pixel px-1 py-0.5 z-30"
                      style={{ 
                        left: loopStartBar * barWidth + 2,
                        transform: 'translateY(-100%)'
                      }}
                    >
                      {loopStartBar + 1}
                    </div>
                    
                    {/* Loop end indicator with bar number */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-25"
                      style={{ left: (loopEndBar + 1) * barWidth }}
                      title={`Loop End: Bar ${loopEndBar + 1}`}
                    />
                    <div
                      className="absolute top-0 bg-orange-500 text-orange-100 text-xs font-pixel px-1 py-0.5 z-30"
                      style={{ 
                        left: (loopEndBar + 1) * barWidth + 2,
                        transform: 'translateY(-100%)'
                      }}
                    >
                      {loopEndBar + 1}
                    </div>
                    
                    {/* Loop region highlight */}
                    <div
                      className="absolute top-0 bottom-0 bg-orange-500/10 z-20 pointer-events-none border-l-2 border-r-2 border-orange-500/30"
                      style={{
                        left: loopStartBar * barWidth,
                        width: (loopEndBar - loopStartBar + 1) * barWidth,
                      }}
                    />
                    
                    {/* Loop range label */}
                    <div
                      className="absolute top-2 bg-orange-500/90 text-orange-100 text-xs font-pixel px-2 py-1 z-30 rounded"
                      style={{
                        left: (loopStartBar * barWidth) + 4,
                        top: 4,
                      }}
                    >
                      LOOP: {loopStartBar + 1}-{loopEndBar + 1}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-3 border-t-4 border-border bg-card">
        <div className="flex items-center justify-between">
          <p className="font-pixel text-xs text-muted-foreground">
            DRAG FROM LIBRARY • CLICK TO SELECT • DRAG TO MOVE • DEL TO REMOVE
          </p>
          <p className="font-pixel text-xs text-accent">
            ▶ PLAYBACK TRAVERSES ARRANGEMENT TIMELINE
          </p>
        </div>
      </div>
    </div>
  );
};
